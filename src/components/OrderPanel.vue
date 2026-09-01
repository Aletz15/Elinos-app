<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { orderCode } from '../lib/whatsapp'
import OrderCard from './OrderCard.vue'
import type { Order, OrderStatus } from '../types'

type FilterTab = 'todos' | OrderStatus

const isUnlocked = ref(sessionStorage.getItem('elinos_panel_unlocked') === '1')
const passwordInput = ref('')
const passwordError = ref('')

function tryUnlock() {
  const expected = import.meta.env.VITE_PANEL_PASSWORD as string | undefined
  if (!expected || passwordInput.value === expected) {
    isUnlocked.value = true
    sessionStorage.setItem('elinos_panel_unlocked', '1')
    loadOrders()
  } else {
    passwordError.value = 'Contraseña incorrecta.'
  }
}

const orders = ref<Order[]>([])
const loading = ref(true)
const loadError = ref('')
const activeTab = ref<FilterTab>('todos')
const search = ref('')

async function loadOrders() {
  loading.value = true
  loadError.value = ''
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    orders.value = (data ?? []) as Order[]
  } catch (err) {
    loadError.value = 'No se pudieron cargar los pedidos. Revisa tu configuración de Supabase (.env).'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function changeStatus(id: string, status: OrderStatus) {
  const target = orders.value.find((o) => o.id === id)
  if (target) target.status = status // optimista
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) {
    console.error(error)
    loadOrders() // revertir si falló
  }
}

async function deleteOrder(id: string) {
  const previous = orders.value
  orders.value = orders.value.filter((o) => o.id !== id) // optimista
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) {
    console.error(error)
    orders.value = previous // revertir si falló
  }
}

const counts = computed(() => ({
  pendiente_pago: orders.value.filter((o) => o.status === 'pendiente_pago').length,
  nuevo: orders.value.filter((o) => o.status === 'nuevo').length,
  en_produccion: orders.value.filter((o) => o.status === 'en_produccion').length,
  enviada: orders.value.filter((o) => o.status === 'enviada').length,
}))

const filteredOrders = computed(() => {
  let list = orders.value
  if (activeTab.value !== 'todos') {
    list = list.filter((o) => o.status === activeTab.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((o) => {
      const code = orderCode(o).toLowerCase()
      const itemsMatch = (o.items ?? []).some(
        (item) =>
          item.character_name.toLowerCase().includes(q) ||
          item.name_to_print.toLowerCase().includes(q)
      )
      return (
        code.includes(q) ||
        code.replace('#', '').includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_whatsapp.toLowerCase().includes(q) ||
        itemsMatch
      )
    })
  }
  return list
})

let channel: ReturnType<typeof supabase.channel> | null = null

onMounted(() => {
  if (isUnlocked.value) loadOrders()

  channel = supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      loadOrders()
    })
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<template>
  <div v-if="!isUnlocked" class="lock">
    <div class="lock-card">
      <h2>Panel de pedidos</h2>
      <p>Ingresa la contraseña del taller para continuar.</p>
      <input
        v-model="passwordInput"
        type="password"
        placeholder="Contraseña"
        @keyup.enter="tryUnlock"
      />
      <button type="button" @click="tryUnlock">Entrar</button>
      <p v-if="passwordError" class="err">{{ passwordError }}</p>
    </div>
  </div>

  <div v-else class="panel">
    <header class="panel-head">
      <div class="title">
        <span class="dot" />
        <h2>Panel de pedidos</h2>
      </div>
      <nav class="tabs">
        <button :class="{ active: activeTab === 'todos' }" @click="activeTab = 'todos'">Todos</button>
        <button :class="{ active: activeTab === 'pendiente_pago' }" @click="activeTab = 'pendiente_pago'">
          Pendiente pago
        </button>
        <button :class="{ active: activeTab === 'nuevo' }" @click="activeTab = 'nuevo'">Nuevo</button>
        <button :class="{ active: activeTab === 'en_produccion' }" @click="activeTab = 'en_produccion'">
          En producción
        </button>
        <button :class="{ active: activeTab === 'enviada' }" @click="activeTab = 'enviada'">Enviada</button>
      </nav>
    </header>

    <div class="stats">
      <div class="stat">
        <span>Pendiente pago</span>
        <strong>{{ counts.pendiente_pago }}</strong>
      </div>
      <div class="stat">
        <span>Nuevo</span>
        <strong>{{ counts.nuevo }}</strong>
      </div>
      <div class="stat">
        <span>En producción</span>
        <strong>{{ counts.en_produccion }}</strong>
      </div>
      <div class="stat">
        <span>Enviada</span>
        <strong>{{ counts.enviada }}</strong>
      </div>
    </div>

    <input
      v-model="search"
      type="text"
      class="search"
      placeholder="Buscar por código (#A3F2), nombre o WhatsApp…"
    />

    <p v-if="loading" class="status-msg">Cargando pedidos…</p>
    <p v-else-if="loadError" class="status-msg err">{{ loadError }}</p>
    <p v-else-if="filteredOrders.length === 0" class="status-msg">No hay pedidos en esta categoría todavía.</p>

    <div v-else class="order-grid">
      <OrderCard
        v-for="o in filteredOrders"
        :key="o.id"
        :order="o"
        @change-status="changeStatus"
        @delete="deleteOrder"
      />
    </div>
  </div>
</template>

<style scoped>
.lock {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.lock-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  width: 320px;
  text-align: center;
}

.lock-card h2 {
  margin: 0 0 6px;
}

.lock-card p {
  color: var(--ink-soft);
  font-size: 13px;
  margin: 0 0 16px;
}

.lock-card input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  margin-bottom: 12px;
}

.lock-card button {
  width: 100%;
  border: none;
  background: var(--pink);
  color: white;
  padding: 10px;
  border-radius: 999px;
  font-weight: 700;
}

.err {
  color: #DC2626;
  font-size: 12px;
  margin-top: 10px;
}

.panel {
  background: var(--panel-dark);
  border-radius: var(--radius-lg);
  padding: 22px;
  color: white;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title h2 {
  margin: 0;
  font-size: 19px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}

.tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tabs button {
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #C9C3DA;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.tabs button.active {
  background: white;
  color: var(--ink);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat {
  background: var(--panel-card);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat span {
  font-size: 12px;
  color: #A79FBF;
}

.stat strong {
  font-size: 22px;
}

.status-msg {
  color: #A79FBF;
  font-size: 14px;
  padding: 20px 0;
}

.status-msg.err {
  color: #FCA5A5;
}

.search {
  width: 100%;
  background: var(--panel-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 11px 16px;
  color: white;
  font-size: 13px;
  margin-bottom: 16px;
}

.search::placeholder {
  color: #857CA0;
}

.order-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
</style>