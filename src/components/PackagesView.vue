<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  SIBLING_PACK_PRICE,
  SIBLING_PACK_TOTAL_LABELS,
  SIBLING_PACK_SIZE_LABEL,
  SIBLING_PACK_FONT_LABEL,
  SIBLING_PACK_SIZE_ID,
  SIBLING_PACK_FONT_ID,
  SIBLING_PACK_SHAPE_ID,
  SIBLING_PACK_SHAPE_LABEL,
} from '../data/siblingpack'
import type { CartItem } from '../types'
import { cart, cartCount } from '../lib/cart'
import { generateId } from '../lib/id'
import { NAME_ALLOWED } from '../lib/validation'
import SectionTitle from './SectionTitle.vue'
import DesignCatalogGallery from './DesignCatalogGallery.vue'

const router = useRouter()

// 👉 Aviso tipo "popup" que aparece un momento — mismo patrón que en
// CatalogView.vue (ver ese archivo para más contexto).
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

// 🎒 Pack para Hermanos: producto aparte, con precio/tamaño/letra fijos
// (ver ../data/siblingPack.ts). "packages" aquí funciona como multiplicador
// del pack completo: 1 = 80 etiquetas (40+40) por $170; 2 = 160 (80+80) por
// $340; etc.
const siblingPack = reactive({
  character1Name: '',
  name1: '',
  character2Name: '',
  name2: '',
  packages: 1,
})

const siblingPackTotal = computed(() => siblingPack.packages * SIBLING_PACK_PRICE)
const siblingPackLabels = computed(() => siblingPack.packages * SIBLING_PACK_TOTAL_LABELS)

function incSiblingPackages() {
  siblingPack.packages += 1
}
function decSiblingPackages() {
  if (siblingPack.packages > 1) siblingPack.packages -= 1
}

const fieldErrors = reactive({
  character1: false,
  name1: false,
  character2: false,
  name2: false,
})

function onCharacter1Input(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) showToast('Este campo no acepta números ni símbolos.')
  siblingPack.character1Name = filtered
  if (filtered.trim()) fieldErrors.character1 = false
}

function onCharacter2Input(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) showToast('Este campo no acepta números ni símbolos.')
  siblingPack.character2Name = filtered
  if (filtered.trim()) fieldErrors.character2 = false
}

function onName1Input(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) showToast('Este campo no acepta números ni símbolos.')
  siblingPack.name1 = filtered
  if (filtered.trim()) fieldErrors.name1 = false
}

function onName2Input(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) showToast('Este campo no acepta números ni símbolos.')
  siblingPack.name2 = filtered
  if (filtered.trim()) fieldErrors.name2 = false
}

function addSiblingPackToCart() {
  const missingCharacter1 = !siblingPack.character1Name.trim()
  const missingName1 = !siblingPack.name1.trim()
  const missingCharacter2 = !siblingPack.character2Name.trim()
  const missingName2 = !siblingPack.name2.trim()
  fieldErrors.character1 = missingCharacter1
  fieldErrors.name1 = missingName1
  fieldErrors.character2 = missingCharacter2
  fieldErrors.name2 = missingName2

  if (missingCharacter1 || missingName1 || missingCharacter2 || missingName2) {
    showToast('Completa el personaje y el nombre de los dos niños antes de agregar el pack.')
    return
  }

  const item: CartItem = {
    id: generateId(),
    character_id: siblingPack.character1Name.trim(),
    character_name: siblingPack.character1Name.trim(),
    name_to_print: siblingPack.name1.trim(),
    is_sibling_pack: true,
    second_character_id: siblingPack.character2Name.trim(),
    second_character_name: siblingPack.character2Name.trim(),
    second_name_to_print: siblingPack.name2.trim(),
    font_id: SIBLING_PACK_FONT_ID,
    font_label: SIBLING_PACK_FONT_LABEL,
    size_id: SIBLING_PACK_SIZE_ID,
    size_label: SIBLING_PACK_SIZE_LABEL,
    shape_id: SIBLING_PACK_SHAPE_ID,
    shape_label: SIBLING_PACK_SHAPE_LABEL,
    packages: siblingPack.packages,
    quantity: siblingPackLabels.value,
    line_total: siblingPackTotal.value,
  }
  cart.value.push(item)
  showToast(`Agregado: Pack para Hermanos · ${item.name_to_print} + ${item.second_name_to_print} ✓`)

  siblingPack.character1Name = ''
  siblingPack.name1 = ''
  siblingPack.character2Name = ''
  siblingPack.name2 = ''
  siblingPack.packages = 1
}

// 👉 El checkout (nombre/whatsapp del cliente, revisar pedido, enviar por
// WhatsApp) vive solo en CatalogView.vue (es donde ya está resuelto y
// probado) — el carrito es compartido (../lib/cart.ts), así que cualquier
// pack agregado aquí ya aparece allá. Este botón solo lleva de regreso.
function goToCheckout() {
  router.push('/')
}
</script>

<template>
  <div class="page-header">
    <h1>Paquetes y promos especiales</h1>
    <p class="subtitle">Combos con precio fijo, aparte del catálogo normal de etiquetas.</p>
  </div>

  <div class="packages-panel packages-panel-highlight">
    <span class="new-badge"><span class="new-badge-emoji">✨</span> NUEVO</span>

    <SectionTitle icon="character">🎒 Pack para Hermanos</SectionTitle>

    <img
      src="/packages/packhermanos.jpeg"
      alt="Pack para Hermanos - promoción de etiquetas"
      class="sibling-pack-flyer"
      loading="lazy"
    />

    <div class="package-info-box">
      <p class="package-info-title">📋 Información del paquete</p>
      <ul class="package-info-list">
        <li>2 niños, 2 nombres</li>
        <li>${{ SIBLING_PACK_PRICE }} el pack — {{ SIBLING_PACK_TOTAL_LABELS }} etiquetas en total ({{ SIBLING_PACK_TOTAL_LABELS / 2 }} c/u)</li>
        <li>Tamaño {{ SIBLING_PACK_SIZE_LABEL }}</li>
        <li>Letra {{ SIBLING_PACK_FONT_LABEL }}</li>
      </ul>
    </div>

    <DesignCatalogGallery />

    <div class="field-row">
      <label class="field">
        <span>Personaje niño 1 *</span>
        <input
          v-model="siblingPack.character1Name"
          @input="onCharacter1Input"
          @blur="onCharacter1Input"
          type="text"
          placeholder="Spiderman"
          :class="{ invalid: fieldErrors.character1 }"
        />
        <p v-if="fieldErrors.character1" class="field-error-text">Este campo es obligatorio.</p>
      </label>
      <label class="field">
        <span>Nombre niño 1 *</span>
        <input
          v-model="siblingPack.name1"
          @input="onName1Input"
          @blur="onName1Input"
          type="text"
          placeholder="Santiago"
          :class="{ invalid: fieldErrors.name1 }"
        />
        <p v-if="fieldErrors.name1" class="field-error-text">Este campo es obligatorio.</p>
      </label>
    </div>

    <div class="field-row">
      <label class="field">
        <span>Personaje niño 2 *</span>
        <input
          v-model="siblingPack.character2Name"
          @input="onCharacter2Input"
          @blur="onCharacter2Input"
          type="text"
          placeholder="Hello Kitty"
          :class="{ invalid: fieldErrors.character2 }"
        />
        <p v-if="fieldErrors.character2" class="field-error-text">Este campo es obligatorio.</p>
      </label>
      <label class="field">
        <span>Nombre niño 2 *</span>
        <input
          v-model="siblingPack.name2"
          @input="onName2Input"
          @blur="onName2Input"
          type="text"
          placeholder="Valeria"
          :class="{ invalid: fieldErrors.name2 }"
        />
        <p v-if="fieldErrors.name2" class="field-error-text">Este campo es obligatorio.</p>
      </label>
    </div>

    <div class="add-item-box">
      <div class="qty-row">
        <span>Packs</span>
        <div class="stepper">
          <button type="button" @click="decSiblingPackages">−</button>
          <strong>{{ siblingPack.packages }}</strong>
          <button type="button" @click="incSiblingPackages">+</button>
        </div>
      </div>
      <p class="labels-count">= {{ siblingPackLabels }} etiquetas · <span class="price-highlight">${{ siblingPackTotal.toFixed(0) }}</span></p>

      <button type="button" class="cta" @click="addSiblingPackToCart">
        + Agregar pack para hermanos al pedido
      </button>
    </div>

    <div v-if="cartCount > 0" class="checkout-nudge">
      <span>🛒 Ya tienes {{ cartCount }} producto(s) en tu pedido.</span>
      <button type="button" class="cta secondary-cta" @click="goToCheckout">
        Ir a mi pedido y finalizar →
      </button>
    </div>
  </div>

  <transition name="toast-fade">
    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </transition>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 4px;
  font-size: 26px;
  color: white;
}

.subtitle {
  margin: 0 0 20px;
  color: #D9C3E2;
  font-size: 14px;
}

.packages-panel {
  background: var(--panel-card);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(250, 204, 21, 0.35);
  padding: 24px;
  max-width: 640px;
}

.packages-panel-highlight {
  position: relative;
  overflow: visible;
  border: 2px solid var(--yellow);
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.12), 0 8px 28px rgba(250, 204, 21, 0.18);
  animation: glow-pulse 2.6s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.12), 0 8px 28px rgba(250, 204, 21, 0.18);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(250, 204, 21, 0.2), 0 8px 32px rgba(250, 204, 21, 0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .packages-panel-highlight {
    animation: none;
  }
}

.new-badge {
  position: absolute;
  top: -14px;
  left: 20px;
  background: var(--yellow);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 999px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transform: rotate(-3deg);
}

.new-badge-emoji {
  font-size: 15px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}

.option-caption {
  font-size: 13px;
  color: #D9C3E2;
  margin: 0 0 18px;
}

.package-info-box {
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  margin: 0 0 18px;
}

.package-info-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--yellow);
}

.package-info-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #D9C3E2;
}

.sibling-pack-flyer {
  display: block;
  width: 100%;
  max-width: 420px;
  margin: 0 auto 18px;
  border-radius: var(--radius-md);
  border: 2px solid var(--pink);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 520px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--yellow);
}

.field input,
.field select {
  border: 2px solid var(--pink);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 14px;
  color: var(--ink);
  background: white;
  text-transform: none;
  font-weight: 400;
  letter-spacing: normal;
}

.field input:focus,
.field select:focus {
  outline: 2px solid var(--pink);
  outline-offset: 1px;
}

.field input.invalid {
  border-color: #DC2626;
  background: #FEF2F2;
}

.field-error-text {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
  color: #DC2626;
}

.add-item-box {
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 8px;
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.labels-count {
  font-size: 12px;
  color: #D9C3E2;
  margin: 0 0 16px;
  text-align: right;
}

.price-highlight {
  color: var(--yellow);
  font-weight: 800;
  font-size: 13px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stepper button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--yellow);
  color: var(--brand-purple);
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.stepper strong {
  color: white;
  font-size: 15px;
}

.cta {
  width: 100%;
  border: none;
  background: var(--pink);
  color: white;
  padding: 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 15px;
}

.checkout-nudge {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  text-align: center;
  font-size: 13px;
  color: #D9C3E2;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.secondary-cta {
  background: var(--ink);
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: white;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  z-index: 100;
  max-width: calc(100vw - 32px);
  width: max-content;
  white-space: normal;
  text-align: center;
  word-break: break-word;
  box-sizing: border-box;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>