<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { orderCode } from '../lib/whatsapp'
import {
  orders,
  ordersLoading,
  ordersLoadError,
  changeOrderStatus,
  deleteOrderById,
  loadOrders,
  startOrdersRealtime,
  resetOrdersState,
  newOrderAlert,
  unlockAudioForNotifications,
  notificationPermission,
  requestNotificationPermission,
  welcomeMessage,
  ensureWelcomeMessage,
} from '../lib/ordersstore'
import OrderCard from './OrderCard.vue'
import type { OrderStatus } from '../types'
import type { Session } from '@supabase/supabase-js'

type FilterTab = 'todos' | OrderStatus

// 👉 Login real con Supabase Auth (correo + contraseña que creaste en el
// dashboard de Supabase → Authentication → Users). Ya no se compara nada
// contra una variable de entorno visible en el navegador.
const session = ref<Session | null>(null)
const checkingSession = ref(true)

const emailInput = ref('')
const passwordInput = ref('')
const loginError = ref('')
const loggingIn = ref(false)

async function tryLogin() {
  unlockAudioForNotifications() // 👈 este clic real desbloquea el audio para la sesión
  loginError.value = ''
  loggingIn.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value,
  })
  loggingIn.value = false
  if (error) {
    loginError.value = 'Correo o contraseña incorrectos.'
    return
  }
  passwordInput.value = ''
}

async function logout() {
  await supabase.auth.signOut()
  resetOrdersState()
}

const activeTab = ref<FilterTab>('todos')
const search = ref('')

// Los datos y funciones de pedidos (orders, ordersLoading, loadOrders,
// changeOrderStatus, deleteOrderById, etc.) ahora viven en ordersStore.ts,
// fuera de este componente — así se quedan en memoria mientras navegas y
// no hay que volver a pedirlos ni mostrar "Cargando…" cada vez que
// regresas a /panel.
async function changeStatus(id: string, status: OrderStatus) {
  await changeOrderStatus(id, status)
}

async function deleteOrder(id: string) {
  await deleteOrderById(id)
}

// 🔔 La notita del pedido nuevo se borra sola después de unos segundos.
let alertTimeout: ReturnType<typeof setTimeout> | null = null
watch(newOrderAlert, (alert) => {
  if (alertTimeout) clearTimeout(alertTimeout)
  if (alert) {
    alertTimeout = setTimeout(() => {
      newOrderAlert.value = null
    }, 6000)
  }
})

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

onMounted(async () => {
  // 🔓 Cualquier interacción tuya dentro del panel desbloquea el audio para
  // esta pestaña — cubre el caso de que ya tenías sesión guardada (no diste
  // clic en "Entrar" en esta carga, así que ese desbloqueo no se disparó).
  // Se escuchan varios tipos de evento (clic, tecla, toque) por si acaso,
  // y NO se quita el listener después del primero: es una operación barata
  // y así cualquier interacción tuya sigue intentando desbloquear hasta
  // que el navegador realmente lo permita.
  ;['click', 'keydown', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, unlockAudioForNotifications)
  })

  // Revisa si ya había una sesión guardada (para no pedir login otra vez
  // cada vez que recargas la página, mientras la sesión siga vigente).
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  checkingSession.value = false

  if (session.value) {
    loadOrders()
    startOrdersRealtime()
    ensureWelcomeMessage(session.value.user?.email)
  }

  // Se actualiza automáticamente si haces login, logout, o si la sesión
  // expira en otra pestaña.
  supabase.auth.onAuthStateChange((_event, newSession) => {
    const hadSession = !!session.value
    session.value = newSession
    if (newSession) {
      loadOrders()
      startOrdersRealtime()
      // ensureWelcomeMessage ya trae su propio guard (no genera uno nuevo
      // si ya hay un mensaje guardado), así que da igual si esto se
      // dispara por un login real o porque el navegador reconfirma la
      // sesión al volver a esta pantalla — el mensaje solo cambia de
      // verdad después de un logout.
      ensureWelcomeMessage(newSession.user?.email)
    } else if (hadSession) {
      resetOrdersState()
    }
  })
})

// 👉 Ya no detenemos la conexión en tiempo real al desmontar (al salir de
// /panel): así, si vuelves, los pedidos ya están cargados y al día, sin
// parpadeo. Se detiene solo al cerrar sesión (ver logout / resetOrdersState).
onUnmounted(() => {})
</script>

<template>
  <div v-if="checkingSession" class="status-msg">Cargando…</div>

  <div v-else-if="!session" class="lock">
    <div class="lock-card">
      <h2>Panel de pedidos</h2>
      <p>Inicia sesión para continuar.</p>
      <input
        v-model="emailInput"
        type="email"
        placeholder="Correo"
        autocomplete="username"
        @keyup.enter="tryLogin"
      />
      <input
        v-model="passwordInput"
        type="password"
        placeholder="Contraseña"
        autocomplete="current-password"
        @keyup.enter="tryLogin"
      />
      <button type="button" :disabled="loggingIn" @click="tryLogin">
        {{ loggingIn ? 'Entrando…' : 'Entrar' }}
      </button>
      <p v-if="loginError" class="err">{{ loginError }}</p>
    </div>
  </div>

  <div v-else class="panel">
    <!-- 📌 Pegajoso: título, pestañas, cerrar sesión y buscador se quedan
         a la vista mientras haces scroll en la lista de pedidos (son los
         controles que usas todo el tiempo). Las tarjetitas de conteo se
         quedan fuera a propósito, para no comerse pantalla útil en celular. -->
    <div class="panel-sticky">
      <transition name="alert-fade">
        <div v-if="newOrderAlert" class="new-order-alert">
          🔔 Nuevo pedido de <strong>{{ newOrderAlert.customer_name }}</strong>
          <button type="button" class="alert-close" @click="newOrderAlert = null">✕</button>
        </div>
      </transition>

      <header class="panel-head">
        <div class="title">
          <div class="title-main">
            <span class="dot" />
            <h2>Panel de pedidos</h2>
          </div>
          <p v-if="welcomeMessage" class="welcome-line">{{ welcomeMessage }}</p>
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
        <button
          v-if="notificationPermission === 'default'"
          type="button"
          class="notif-btn"
          @click="requestNotificationPermission"
        >
          🔔 Activar notificaciones
        </button>
        <span v-else-if="notificationPermission === 'denied'" class="notif-blocked" title="Las bloqueaste en el navegador. Actívalas desde el candado 🔒 junto a la URL.">
          🔕 Notificaciones bloqueadas
        </span>
        <button type="button" class="logout-btn" @click="logout">Cerrar sesión</button>
      </header>

      <input
        v-model="search"
        type="text"
        class="search"
        placeholder="Buscar por código (#A3F2), nombre o WhatsApp…"
      />
    </div>

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

    <p v-if="ordersLoading" class="status-msg">Cargando pedidos…</p>
    <p v-else-if="ordersLoadError" class="status-msg err">{{ ordersLoadError }}</p>
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

.lock-card button:disabled {
  opacity: 0.6;
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

.panel-sticky {
  /* Se pega justo debajo de tu barra morada de arriba (que ya es pegajosa),
     usando --topbar-h para que nunca se encimen una con otra. */
  position: sticky;
  top: var(--topbar-h, 0px);
  z-index: 20;
  background-color: var(--panel-dark);
  padding-top: 4px;
  margin: -4px -4px 14px;
  padding-left: 4px;
  padding-right: 4px;
  /* 👉 "Colchón" extra opaco abajo: sin esto, en algunos celulares se
     alcanza a ver un hilito de la tarjeta de atrás justo en el borde
     donde termina la barra pegajosa y empieza el scroll normal. */
  padding-bottom: 6px;
  /* 👉 Aísla esta barra del resto de la página para que el navegador no
     tenga que recalcular/repintar todo junto en cada frame de scroll —
     ayuda a que la barra y las tarjetas de abajo no se "desincronicen"
     un instante durante un scroll muy rápido. */
  contain: paint;
  isolation: isolate;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}

.new-order-alert {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--green);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 14px;
}

.alert-close {
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1;
  margin-left: 4px;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.welcome-line {
  margin: 0;
  padding-left: 16px; /* alineado con el texto del título, no con el puntito verde */
  font-size: 12px;
  font-weight: 600;
  color: #C9C3DA;
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

.logout-btn {
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #FCA5A5;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.notif-btn {
  border: none;
  background: var(--pink);
  color: white;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.notif-blocked {
  font-size: 12px;
  color: #A79FBF;
  cursor: help;
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