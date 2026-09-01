<script setup lang="ts">
import type { Order, OrderStatus } from '../types'
import { STATUS_LABELS } from '../types'
import { orderCode } from '../lib/whatsapp'

const props = defineProps<{ order: Order }>()
const emit = defineEmits<{
  (e: 'change-status', id: string, status: OrderStatus): void
  (e: 'delete', id: string): void
}>()

const statusOrder: OrderStatus[] = ['pendiente_pago', 'nuevo', 'en_produccion', 'enviada']

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pendiente_pago: 'nuevo',
  nuevo: 'en_produccion',
  en_produccion: 'enviada',
}

const nextActionLabel: Partial<Record<OrderStatus, string>> = {
  pendiente_pago: 'Marcar como pagado ✓',
  nuevo: 'Pasar a producción →',
  en_produccion: 'Marcar como enviada ✓',
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confirmDelete() {
  const firstItem = props.order.items?.[0]
  const label = `${firstItem?.character_name ?? ''} · ${firstItem?.name_to_print ?? ''} (${orderCode(props.order)})`
  if (confirm(`¿Borrar este pedido?\n\n${label}\n\nEsta acción no se puede deshacer.`)) {
    emit('delete', props.order.id!)
  }
}
</script>

<template>
  <article class="card" :class="props.order.status">
    <header>
      <div class="code-row">
        <span class="code">{{ orderCode(order) }}</span>
      </div>
      <div class="items-list">
        <div v-for="item in order.items" :key="item.id" class="item-row">
          <div>
            <strong>{{ item.character_name }} · {{ item.name_to_print }}</strong>
            <div class="meta">
              {{ item.font_label }} · {{ item.shape_label }} · {{ item.size_label }} · {{ item.packages }} paquete(s) · {{ item.quantity }} etiquetas
            </div>
          </div>
          <span class="item-price">${{ item.line_total }}</span>
        </div>
      </div>
      <div class="total-row">
        <span>Total</span>
        <span class="total">${{ order.total }}</span>
      </div>
    </header>

    <div class="customer">
      <span>{{ order.customer_name }}</span>
      <a
        v-if="order.customer_whatsapp"
        :href="`https://wa.me/${order.customer_whatsapp.replace(/\\D/g, '')}`"
        target="_blank"
      >
        {{ order.customer_whatsapp }}
      </a>
    </div>

    <p v-if="order.note" class="note">📝 {{ order.note }}</p>
    <p v-if="order.wants_preview" class="preview-flag">🔍 Pidió aprobar vista previa antes de imprimir</p>

    <button
      v-if="nextActionLabel[order.status]"
      type="button"
      class="next-action"
      :class="order.status"
      @click="emit('change-status', order.id!, nextStatusMap[order.status]!)"
    >
      {{ nextActionLabel[order.status] }}
    </button>
    <div v-else class="done-badge">✓ Pedido completado</div>

    <footer>
      <span class="date">{{ formatDate(order.created_at) }}</span>
      <div class="footer-right">
        <details class="manual">
          <summary>Cambiar manualmente</summary>
          <select
            :value="order.status"
            @change="emit('change-status', order.id!, ($event.target as HTMLSelectElement).value as OrderStatus)"
          >
            <option v-for="s in statusOrder" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
          </select>
        </details>
        <button type="button" class="delete-btn" title="Borrar pedido" @click="confirmDelete">🗑</button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.card {
  background: var(--panel-card);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  border-left: 4px solid var(--ink-soft);
  color: #EDEAF5;
}

.card.pendiente_pago { border-left-color: #F472B6; }
.card.nuevo { border-left-color: var(--blue); }
.card.en_produccion { border-left-color: var(--amber); }
.card.enviada { border-left-color: var(--green); }

header {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.code-row {
  margin-bottom: 6px;
}

.code {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #F472B6;
  background: rgba(244, 114, 182, 0.15);
  padding: 2px 8px;
  border-radius: 999px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.item-row strong {
  font-size: 13px;
}

.item-price {
  font-size: 12px;
  font-weight: 700;
  color: #C9C3DA;
  flex-shrink: 0;
  white-space: nowrap;
}

.meta {
  font-size: 12px;
  color: #A79FBF;
  margin-top: 2px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  margin-top: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: #C9C3DA;
}

.total {
  font-weight: 800;
  color: var(--pink);
}

.customer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #C9C3DA;
  margin-bottom: 6px;
}

.customer a {
  color: #93C5FD;
  text-decoration: none;
}

.note {
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0 0 10px;
  color: #D8D4E6;
}

.preview-flag {
  font-size: 12px;
  font-weight: 700;
  background: rgba(244, 114, 182, 0.15);
  color: #F9A8D4;
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0 0 10px;
}

.next-action {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  margin-bottom: 10px;
}

.next-action.pendiente_pago {
  background: #F472B6;
}

.next-action.nuevo {
  background: var(--blue);
}

.next-action.en_produccion {
  background: var(--amber);
}

.done-badge {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #86EFAC;
  background: rgba(34, 197, 94, 0.12);
  border-radius: 999px;
  padding: 8px;
  margin-bottom: 10px;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date {
  font-size: 11px;
  color: #857CA0;
}

.manual {
  font-size: 11px;
  color: #857CA0;
}

.manual summary {
  cursor: pointer;
  list-style: none;
}

.manual summary::-webkit-details-marker {
  display: none;
}

.manual select {
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-btn {
  border: none;
  background: rgba(220, 38, 38, 0.15);
  color: #FCA5A5;
  border-radius: 8px;
  width: 26px;
  height: 26px;
  font-size: 12px;
  line-height: 1;
}
</style>