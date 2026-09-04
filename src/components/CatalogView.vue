<script setup lang="ts">
import { computed, reactive, ref, nextTick } from 'vue'
import { characters, shapes, sizes, fonts, PACKAGE_PRICE } from '../data/catalog'
import { paymentPolicy, bankAccount, alternativePaymentLink } from '../data/payment'
import { supabase } from '../lib/supabase'
import { buildOrderWhatsappLink, orderCode } from '../lib/whatsapp'
import { cart, cartTotal, mobileCartOpen } from '../lib/cart'
import SizeComparison from './Sizecomparison.vue'
import WorkGallery from './WorkGallery.vue'
import WhyChooseSection from './WhyChooseSection.vue'
import DesignCatalogGallery from './DesignCatalogGallery.vue'
import ReferenceImagesUpload from './Referenceimagesupload.vue'
import FaqSection from './FaqSection.vue'
import LocationSection from './LocationSection.vue'
import HowToApply from './HowToApply.vue'
import SectionTitle from './SectionTitle.vue'
import type { CartItem, Order } from '../types'

const copied = ref(false)
function copyClabe() {
  navigator.clipboard.writeText(bankAccount.clabe.replace(/\s/g, ''))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

// Aviso tipo "popup" que aparece un momento cuando el usuario intenta
// escribir un carácter no permitido en algún campo, o cuando agrega/quita algo del carrito.
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

// 🆔 Genera un id único para cada línea del carrito. Algunos navegadores de
// celular (sobre todo el navegador interno de apps como WhatsApp/Instagram,
// o versiones viejas de Safari/Android) NO tienen crypto.randomUUID().
// Antes se usaba crypto.randomUUID() directo: si no existía, la función
// tronaba en silencio y "Agregar etiqueta" no hacía nada en esos celulares.
// Esta versión usa crypto.randomUUID() si está disponible y, si no, genera
// un id igual de único a mano — así el botón funciona en cualquier celular.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // sigue abajo al método alterno
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// "form" es la etiqueta que se está configurando ahora mismo, antes de agregarla al pedido.
// 👉 characterId se queda fijo en 'Otro Personaje': esa entrada de
// catalog.ts trae el emoji/color (lápiz gris) que usa la tarjeta "Otro
// Personaje" del catálogo (ver template) como ícono.
const form = reactive({
  characterId: 'Otro Personaje',
  nameToPrint: '',
  fontId: fonts[0].id,
  sizeId: sizes[0].id,
  shapeId: shapes[0].id,
  packages: 1,
  customerName: '',
  customerWhatsapp: '',
  note: '',
  wantsPreview: false,
})

// 📎 Imágenes de referencia (opcionales, máx. 3) que el cliente puede
// adjuntar con su pedido — se suben a Supabase Storage recién cuando el
// pedido se envía con éxito (ver submitOrder).
const referenceImages = ref<File[]>([])

// 👉 El WhatsApp mexicano son 10 dígitos. Se filtra todo lo que no sea número
// y se corta en 10 dígitos aunque el cliente pegue o escriba más.
const WHATSAPP_DIGITS = 10

function onWhatsappInput(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(/\D/g, '').slice(0, WHATSAPP_DIGITS)
  if (filtered !== raw) {
    showToast(`Este campo solo acepta números (máximo ${WHATSAPP_DIGITS} dígitos).`)
  }
  form.customerWhatsapp = filtered
  // En cuanto llega a 10 dígitos se le quita el rojo al momento, sin
  // esperar a que salga del campo.
  if (filtered.length === WHATSAPP_DIGITS) fieldErrors.customerWhatsapp = false
}

// Se valida al salir del campo (blur): si le faltan dígitos se pone en rojo
// y se le dice cuántos le faltan.
function onWhatsappBlur() {
  fieldErrors.customerWhatsapp = form.customerWhatsapp.length !== WHATSAPP_DIGITS
}

const whatsappErrorText = computed(() => {
  const missing = WHATSAPP_DIGITS - form.customerWhatsapp.length
  if (missing <= 0) return ''
  if (form.customerWhatsapp.length === 0) return 'Este campo es obligatorio.'
  return `Faltan ${missing} dígito${missing === 1 ? '' : 's'}.`
})

// Solo letras, espacios y acentos/ñ. Sin números ni símbolos raros.
const NAME_ALLOWED = /[^a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]/g

function onNameToPrintInput(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) {
    showToast('Este campo no acepta números ni símbolos.')
  }
  form.nameToPrint = filtered
  if (filtered.trim()) fieldErrors.nameToPrint = false
}

function onCustomerNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const filtered = raw.replace(NAME_ALLOWED, '')
  if (filtered !== raw) {
    showToast('Este campo no acepta números ni símbolos.')
  }
  form.customerName = filtered
  if (filtered.trim()) fieldErrors.customerName = false
}

const sending = ref(false)
const reviewing = ref(false)
const sent = ref(false)
const errorMsg = ref('')
const lastOrder = ref<Order | null>(null)

function sendOrderAndProof() {
  if (!lastOrder.value) return
  window.open(buildOrderWhatsappLink(lastOrder.value), '_blank')
}

const selectedCharacter = computed(
  () => characters.find((c) => c.id === form.characterId) ?? characters[0]
)

// 👉 El cliente decide con este checkbox si quiere un personaje/diseño
// distinto al catálogo de arriba. Si NO lo activa, no se le pide nada más
// (el pedido se agrega igual). Si SÍ lo activa, entonces el campo de texto
// de abajo aparece y se vuelve obligatorio — porque de nada sirve activar
// "quiero algo diferente" sin decirnos qué es.
const wantsCustomCharacter = ref(false)
const customCharacterName = ref('')
const effectiveCharacterName = computed(() => {
  if (wantsCustomCharacter.value) return customCharacterName.value.trim() || 'Sin especificar'
  return 'Diseño del catálogo'
})
// 👉 Este es el que se guarda en Supabase (columna character_id). Antes
// siempre se guardaba 'Otro Personaje' aunque el cliente NO hubiera
// activado esa tarjeta, lo cual confundía al revisar los pedidos. Ahora
// solo dice 'Otro Personaje' cuando de verdad se activó; si no, se guarda
// 'catalogo' para dejar claro que el diseño es uno del catálogo normal.
const effectiveCharacterId = computed(() => (wantsCustomCharacter.value ? 'Otro Personaje' : 'catalogo'))
const selectedShape = computed(() => shapes.find((s) => s.id === form.shapeId) ?? shapes[0])
const selectedSize = computed(() => sizes.find((s) => s.id === form.sizeId) ?? sizes[0])
const selectedFont = computed(() => fonts.find((f) => f.id === form.fontId) ?? fonts[0])

function sizeThumb(s: (typeof sizes)[number]) {
  if (!s.images || s.images.length === 0) return undefined
  return s.images[0]
}

// Cada paquete cuesta lo mismo (PACKAGE_PRICE) sin importar el tamaño elegido;
// lo que cambia por tamaño es cuántas etiquetas trae cada paquete. No se vende por unidad suelta.
const totalLabels = computed(() => form.packages * selectedSize.value.piecesPerPackage)
const total = computed(() => {
  if (form.packages <= 0) return 0
  return form.packages * PACKAGE_PRICE
})

function incPackages() {
  form.packages += 1
}
function decPackages() {
  if (form.packages > 1) form.packages -= 1
}

// 🛒 El carrito y el estado del panel móvil ahora viven en ../lib/cart.ts
// (compartidos con la barra superior en App.vue) — ver ese archivo.

// 🔴 Campos obligatorios que se marcan en rojo cuando el cliente intenta
// agregar una etiqueta o enviar el pedido sin llenarlos. Funciona igual en
// computadora y en celular (no depende del tamaño de pantalla).
// 👉 "customCharacter" solo se valida cuando el cliente activó el checkbox
// de "otro personaje/diseño" (ver wantsCustomCharacter) — si no lo activó,
// nunca se marca en rojo.
const fieldErrors = reactive({
  customCharacter: false,
  nameToPrint: false,
  customerName: false,
  customerWhatsapp: false,
})

// 📍 Referencias a los campos obligatorios, para poder llevar al cliente
// directo al primero que le falta cuando el toast dice "completa los
// campos obligatorios" — así no tiene que buscarlo a ojo en el formulario.
const customCharacterInput = ref<HTMLInputElement | null>(null)
const nameToPrintInput = ref<HTMLInputElement | null>(null)
const customerNameInput = ref<HTMLInputElement | null>(null)
const customerWhatsappInput = ref<HTMLInputElement | null>(null)

function scrollToField(el: HTMLInputElement | null) {
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // Se espera un poco a que termine el scroll antes de enfocar, para que
  // en celular no se abra el teclado a medio scroll y lo trabe.
  window.setTimeout(() => el.focus({ preventScroll: true }), 350)
}

function addToCart() {
  const missingCustomCharacter = wantsCustomCharacter.value && !customCharacterName.value.trim()
  const missingName = !form.nameToPrint.trim()
  const missingCustomerName = !form.customerName.trim()
  const missingWhatsapp = form.customerWhatsapp.length !== WHATSAPP_DIGITS

  fieldErrors.customCharacter = missingCustomCharacter
  fieldErrors.nameToPrint = missingName
  fieldErrors.customerName = missingCustomerName
  fieldErrors.customerWhatsapp = missingWhatsapp

  if (missingCustomCharacter || missingName || missingCustomerName || missingWhatsapp) {
    showToast('Completa los campos obligatorios (*) marcados en rojo antes de agregar.')
    nextTick(() => {
      if (missingCustomCharacter) scrollToField(customCharacterInput.value)
      else if (missingName) scrollToField(nameToPrintInput.value)
      else if (missingCustomerName) scrollToField(customerNameInput.value)
      else if (missingWhatsapp) scrollToField(customerWhatsappInput.value)
    })
    return
  }
  if (form.packages <= 0) return

  try {
    const item: CartItem = {
      id: generateId(),
      character_id: effectiveCharacterId.value,
      character_name: effectiveCharacterName.value,
      name_to_print: form.nameToPrint.trim(),
      font_id: selectedFont.value.id,
      font_label: selectedFont.value.label,
      size_id: selectedSize.value.id,
      size_label: selectedSize.value.label,
      shape_id: selectedShape.value.id,
      shape_label: selectedShape.value.label,
      packages: form.packages,
      quantity: totalLabels.value,
      line_total: total.value,
    }
    cart.value.push(item)
    showToast(`Agregado: ${item.character_name} · ${item.name_to_print} ✓`)

    // Se limpia el nombre y la cantidad para la siguiente etiqueta;
    // el diseño/tamaño/forma se quedan como están por si el cliente quiere repetir.
    form.nameToPrint = ''
    form.packages = 1
    customCharacterName.value = ''
  } catch (err) {
    // Si algo truena aquí, antes el cliente no veía nada (fallo silencioso).
    // Ahora al menos se entera de que algo salió mal y puede reintentar.
    console.error('Error al agregar etiqueta al carrito:', err)
    showToast('No se pudo agregar la etiqueta. Intenta de nuevo.')
  }
}

function removeFromCart(id: string) {
  cart.value = cart.value.filter((item) => item.id !== id)
}

const canSubmit = computed(() => {
  return (
    cart.value.length > 0 &&
    form.customerName.trim().length > 0 &&
    form.customerWhatsapp.length === WHATSAPP_DIGITS &&
    !sending.value
  )
})

function openReview() {
  if (sending.value) return

  if (cart.value.length === 0) {
    showToast('Agrega al menos una etiqueta antes de enviar tu pedido.')
    return
  }

  const missingCustomerName = !form.customerName.trim()
  const missingWhatsapp = form.customerWhatsapp.length !== WHATSAPP_DIGITS
  fieldErrors.customerName = missingCustomerName
  fieldErrors.customerWhatsapp = missingWhatsapp

  if (missingCustomerName || missingWhatsapp) {
    showToast('Completa los campos marcados en rojo antes de enviar.')
    // En celular la hoja "Tu pedido" tapa el formulario — se cierra para
    // que el cliente vea el campo al que lo llevamos.
    mobileCartOpen.value = false
    nextTick(() => {
      if (missingCustomerName) scrollToField(customerNameInput.value)
      else if (missingWhatsapp) scrollToField(customerWhatsappInput.value)
    })
    return
  }

  mobileCartOpen.value = false
  reviewing.value = true
}

function editOrder() {
  reviewing.value = false
}

async function submitOrder() {
  errorMsg.value = ''
  if (!canSubmit.value) return

  const order: Order = {
    items: cart.value,
    total: cartTotal.value,
    customer_name: form.customerName.trim(),
    customer_whatsapp: form.customerWhatsapp.trim(),
    note: form.note.trim() || null,
    wants_preview: form.wantsPreview,
    status: 'pendiente_pago',
  }

  sending.value = true
  try {
    const { data, error } = await supabase.from('orders').insert(order).select().single()
    if (error) throw error

    lastOrder.value = data as Order
    sent.value = true
    reviewing.value = false

    // 📋 Además de guardar el pedido completo (con "items" como JSON), se
    // guarda cada etiqueta como su propia fila en "order_items" — así en
    // Supabase se puede filtrar/contar por personaje, tamaño, etc. sin
    // tener que abrir el JSON. Si esto falla, no se le muestra error al
    // cliente porque su pedido YA se guardó bien; solo se registra en consola.
    try {
      const code = orderCode(lastOrder.value)
      const rows = cart.value.map((item) => ({
        order_id: lastOrder.value!.id,
        order_code: code,
        character_id: item.character_id,
        character_name: item.character_name,
        name_to_print: item.name_to_print,
        font_id: item.font_id,
        font_label: item.font_label,
        size_id: item.size_id,
        size_label: item.size_label,
        shape_id: item.shape_id,
        shape_label: item.shape_label,
        packages: item.packages,
        quantity: item.quantity,
        line_total: item.line_total,
      }))
      const { error: itemsError } = await supabase.from('order_items').insert(rows)
      if (itemsError) console.error('No se pudo guardar el detalle en order_items:', itemsError)
    } catch (itemsErr) {
      console.error('No se pudo guardar el detalle en order_items:', itemsErr)
    }

    // 📎 Si el cliente adjuntó imágenes de referencia, se suben ahora al
    // bucket privado (usando el id del pedido ya creado) y se guardan sus
    // rutas en la columna "reference_images". Igual que con order_items,
    // si algo falla aquí no se le muestra error al cliente — su pedido ya
    // quedó guardado bien de todas formas.
    if (referenceImages.value.length > 0) {
      try {
        const orderId = lastOrder.value!.id!
        const paths: string[] = []

        for (let i = 0; i < referenceImages.value.length; i++) {
          const file = referenceImages.value[i]
          const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
          const path = `${orderId}/${i + 1}-${safeName}`
          const { error: uploadError } = await supabase.storage
            .from('referencias-pedido')
            .upload(path, file, { upsert: true })
          if (uploadError) {
            console.error('No se pudo subir una imagen de referencia:', uploadError)
            continue
          }
          paths.push(path)
        }

        if (paths.length > 0) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ reference_images: paths })
            .eq('id', orderId)
          if (updateError) console.error('No se pudo guardar reference_images:', updateError)
          else lastOrder.value!.reference_images = paths
        }
      } catch (refErr) {
        console.error('No se pudieron subir las imágenes de referencia:', refErr)
      }
    }
  } catch (err) {
    console.error(err)
    errorMsg.value =
      'No se pudo enviar la solicitud. Revisa tu conexión a Supabase (archivo .env) e inténtalo de nuevo.'
  } finally {
    sending.value = false
  }
}

function newOrder() {
  sent.value = false
  reviewing.value = false
  mobileCartOpen.value = false
  lastOrder.value = null
  cart.value = []
  form.nameToPrint = ''
  form.packages = 1
  form.note = ''
  form.wantsPreview = false
  referenceImages.value = []
  wantsCustomCharacter.value = false
  customCharacterName.value = ''
  fieldErrors.customCharacter = false
  fieldErrors.nameToPrint = false
  fieldErrors.customerName = false
  fieldErrors.customerWhatsapp = false
}
</script>

<template>
  <div class="page-header">
    <h1>Elige tu diseño</h1>
    <p class="subtitle">Etiquetas planchables para ropa · se planchan, sin costura · vendidas por paquete completo, ${{ PACKAGE_PRICE }} c/u.</p>
  </div>

  <div class="layout">
    <section class="catalog">
      <WorkGallery />
      <WhyChooseSection />
      <FaqSection />
      <LocationSection />
      <HowToApply />

      <SectionTitle icon="character" divider>Escoge tu personaje</SectionTitle>
      <DesignCatalogGallery />

      <button
        type="button"
        class="otro-personaje-card"
        :class="{ active: wantsCustomCharacter }"
        @click="wantsCustomCharacter = !wantsCustomCharacter"
      >
        <div class="char-avatar" :style="{ background: selectedCharacter.color }">
          <img v-if="selectedCharacter.image" :src="selectedCharacter.image" :alt="selectedCharacter.name" />
          <span v-else class="emoji-fallback">{{ selectedCharacter.emoji }}</span>
        </div>
        <strong>{{ selectedCharacter.name }}</strong>
      </button>
      <p class="otro-personaje-hint">👆 Tócalo si quieres un diseño distinto al del catálogo de arriba</p>

      <div class="field-row" v-if="wantsCustomCharacter">
        <label class="field">
          <span>¿Cuál personaje o diseño quieres? *</span>
          <input
            v-model="customCharacterName"
            ref="customCharacterInput"
            @input="fieldErrors.customCharacter = !customCharacterName.trim()"
            @blur="fieldErrors.customCharacter = !customCharacterName.trim()"
            type="text"
            placeholder="Ej. Stitch, Hello Kitty, Pokémon Bulbasaur, Bluey..."
            :class="{ invalid: fieldErrors.customCharacter }"
          />
          <p class="field-hint">Sé específico: si es un Pokémon dinos cuál, si es de una serie dinos el nombre exacto del personaje.</p>
          <p v-if="fieldErrors.customCharacter" class="field-error-text">Este campo es obligatorio.</p>
        </label>
      </div>

      <div class="field-row">
        <label class="field">
          <span>Nombre a imprimir *</span>
          <input
            v-model="form.nameToPrint"
            ref="nameToPrintInput"
            @input="onNameToPrintInput"
            @blur="onNameToPrintInput"
            type="text"
            placeholder="Valentina"
            :class="{ invalid: fieldErrors.nameToPrint }"
          />
          <p v-if="fieldErrors.nameToPrint" class="field-error-text">Este campo es obligatorio.</p>
        </label>
      </div>

      <div class="field">
        <SectionTitle icon="font" divider>Tipo de letra</SectionTitle>
        <div class="option-rows">
          <button
            v-for="f in fonts"
            :key="f.id"
            type="button"
            class="option-row"
            :class="{ active: f.id === form.fontId }"
            @click="form.fontId = f.id"
          >
            <img v-if="f.image" class="option-row-thumb" :src="f.image" :alt="f.label" />
            <span class="option-row-label">{{ f.label }}</span>
          </button>
        </div>
      </div>

      <div class="field">
        <SectionTitle icon="ruler" divider>Tamaño</SectionTitle>
        <div class="option-rows">
          <button
            v-for="s in sizes"
            :key="s.id"
            type="button"
            class="option-row"
            :class="{ active: s.id === form.sizeId }"
            @click="form.sizeId = s.id"
          >
            <div class="option-row-thumb-wrap" v-if="sizeThumb(s)">
              <img class="option-row-thumb" :src="sizeThumb(s)" :alt="s.label" />
            </div>
            <span class="option-row-text">
              <span class="option-row-label">{{ s.label }}</span>
              <span class="option-row-qty">{{ s.piecesPerPackage }} pzas</span>
            </span>
          </button>
        </div>
        <p class="option-caption">${{ PACKAGE_PRICE }} cualquier medida</p>

        <SizeComparison :sizes="sizes" :selected-id="form.sizeId" />
      </div>

      <div class="field" v-if="shapes.length > 1">
        <SectionTitle icon="shape" divider>Forma</SectionTitle>
        <div class="pill-group">
          <button
            v-for="s in shapes"
            :key="s.id"
            type="button"
            class="pill outline"
            :class="{ active: s.id === form.shapeId }"
            @click="form.shapeId = s.id"
          >
            <span>{{ s.label }}</span>
            <span v-if="s.id === form.shapeId" class="pill-check">✓</span>
          </button>
        </div>
      </div>
      <div class="field" v-else>
        <SectionTitle icon="shape" divider>Forma (fija)</SectionTitle>
        <div class="fixed-shape-note">📐 {{ shapes[0].label }}</div>
      </div>

      <div class="field package-info">
        <SectionTitle icon="info">Sobre los paquetes</SectionTitle>
        <div class="fixed-shape-note">
          👕 Etiquetas planchables para ropa. Se venden solo por paquete completo del tamaño
          elegido ({{ selectedSize.piecesPerPackage }} etiquetas) — no hay unidades sueltas.
        </div>
      </div>

      <div class="add-item-box">
        <div class="qty-row">
          <span>Paquetes de {{ selectedSize.piecesPerPackage }}</span>
          <div class="stepper">
            <button type="button" @click="decPackages">−</button>
            <strong>{{ form.packages }}</strong>
            <button type="button" @click="incPackages">+</button>
          </div>
        </div>
        <p class="labels-count">= {{ totalLabels }} etiquetas · <span class="price-highlight">${{ total.toFixed(0) }}</span></p>

        <button type="button" class="cta add-cart-btn" @click="addToCart">
          + Agregar esta etiqueta al pedido
        </button>
      </div>

      <SectionTitle icon="notes" divider>Tus datos</SectionTitle>

      <div class="field-row">
        <label class="field">
          <span>Tu nombre *</span>
          <input
            v-model="form.customerName"
            ref="customerNameInput"
            @input="onCustomerNameInput"
            @blur="onCustomerNameInput"
            type="text"
            placeholder="Ana Gómez"
            :class="{ invalid: fieldErrors.customerName }"
          />
          <p v-if="fieldErrors.customerName" class="field-error-text">Este campo es obligatorio.</p>
        </label>
        <label class="field">
          <span>Tu WhatsApp *</span>
          <input
            v-model="form.customerWhatsapp"
            ref="customerWhatsappInput"
            @input="onWhatsappInput"
            @blur="onWhatsappBlur"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            placeholder="9991234567"
            :class="{ invalid: fieldErrors.customerWhatsapp }"
          />
          <p v-if="fieldErrors.customerWhatsapp" class="field-error-text">{{ whatsappErrorText }}</p>
        </label>
      </div>

      <label class="field">
        <span>Nota para Elinos (opcional)</span>
        <textarea v-model="form.note" rows="3" placeholder="Las quiero para el 15 de octubre, colores pastel..." />
      </label>

      <ReferenceImagesUpload v-model="referenceImages" />

      <label class="checkbox-field">
        <input v-model="form.wantsPreview" type="checkbox" />
        <span>
          Quiero ver y aprobar una vista previa antes de que se imprima
          <em>(puede tardar un poco más en estar lista)</em>
        </span>
      </label>
    </section>

    <aside class="summary" :class="{ 'mobile-open': mobileCartOpen }">
      <button
        type="button"
        class="summary-close"
        @click="mobileCartOpen = false"
        aria-label="Cerrar pedido"
      >
        ✕
      </button>
      <h2>Tu pedido {{ cart.length ? `(${cart.length})` : '' }}</h2>

      <p v-if="cart.length === 0" class="empty-cart">
        Todavía no agregas ninguna etiqueta. Dale a
        <strong>"Agregar esta etiqueta al pedido"</strong>.
      </p>

      <div v-else class="cart-list">
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <div>
            <strong>{{ item.character_name }} · {{ item.name_to_print }}</strong>
            <div class="muted">
              {{ item.font_label }} · {{ item.shape_label }} · {{ item.size_label }} · {{ item.packages }} paquete(s) · {{ item.quantity }} etiquetas
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${{ item.line_total.toFixed(0) }}</span>
            <button type="button" class="remove-btn" title="Quitar" @click="removeFromCart(item.id)">✕</button>
          </div>
        </div>
      </div>

      <div class="total-row">
        <strong>Total</strong>
        <strong class="total">${{ cartTotal.toFixed(0) }}</strong>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <button v-if="!sent" class="cta" type="button" :disabled="sending" @click="openReview">
        Enviar solicitud
      </button>

      <p v-if="!sent" class="hint">Respondemos en menos de 24 h 💗</p>
    </aside>

    <!-- 📱 Solo visible en celular: fondo oscuro detrás del panel, para poder
         cerrarlo tocando fuera. El botón que lo abre ahora es el ícono del
         carrito en la barra superior (ver App.vue). En escritorio el panel
         ya está siempre visible en su columna, así que esto queda oculto
         por CSS. -->
    <div
      v-if="mobileCartOpen"
      class="cart-backdrop"
      @click="mobileCartOpen = false"
    ></div>

    <div v-if="reviewing" class="payment-overlay">
      <div class="payment-card">
        <header class="payment-head">
          <strong>Revisa tu pedido</strong>
          <p>Confirma que todo esté correcto antes de enviarlo — después de enviarlo ya no se puede editar.</p>
        </header>

        <div class="review-cart-list">
          <div v-for="item in cart" :key="item.id" class="review-item">
            <div>
              <strong>{{ item.character_name }} · {{ item.name_to_print }}</strong>
              <div class="muted">
                {{ item.font_label }} · {{ item.shape_label }} · {{ item.size_label }} · {{ item.packages }} paquete(s) · {{ item.quantity }} etiquetas
              </div>
            </div>
            <span class="cart-item-price">${{ item.line_total.toFixed(0) }}</span>
          </div>
        </div>

        <div class="review-list">
          <div class="review-row">
            <span>Tu nombre</span>
            <strong>{{ form.customerName }}</strong>
          </div>
          <div class="review-row">
            <span>Tu WhatsApp</span>
            <strong>{{ form.customerWhatsapp }}</strong>
          </div>
          <div class="review-row" v-if="form.note">
            <span>Nota</span>
            <strong>{{ form.note }}</strong>
          </div>
          <div class="review-row" v-if="form.wantsPreview">
            <span>Vista previa</span>
            <strong>Sí, quiero aprobarla antes de imprimir</strong>
          </div>
        </div>

        <div class="payment-total">
          <span>Total a pagar</span>
          <strong>${{ cartTotal.toFixed(0) }}</strong>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="button" class="cta" :disabled="sending" @click="submitOrder">
          {{ sending ? 'Enviando…' : 'Confirmar y enviar pedido' }}
        </button>
        <button type="button" class="cta secondary" :disabled="sending" @click="editOrder">
          Editar pedido
        </button>
      </div>
    </div>

    <div v-if="sent" class="payment-overlay">
      <div class="payment-card">
        <header class="payment-head">
          <strong>¡Pedido registrado! 🎉</strong>
          <p>Solo falta un paso para que empecemos a elaborarlo:</p>
        </header>

        <div class="order-code-box" v-if="lastOrder">
          <span>Tu código de pedido</span>
          <strong>{{ orderCode(lastOrder) }}</strong>
        </div>

        <p class="policy">{{ paymentPolicy }}</p>

        <div class="bank-box">
          <div class="bank-row">
            <span>Banco</span>
            <strong>{{ bankAccount.bank }}</strong>
          </div>
          <div class="bank-row">
            <span>Titular</span>
            <strong>{{ bankAccount.holder }}</strong>
          </div>
          <div class="bank-row">
            <span>CLABE</span>
            <div class="clabe">
              <strong>{{ bankAccount.clabe }}</strong>
              <button type="button" @click="copyClabe">{{ copied ? '¡Copiado!' : 'Copiar' }}</button>
            </div>
          </div>
          <div class="bank-row" v-if="bankAccount.card">
            <span>Tarjeta</span>
            <strong>{{ bankAccount.card }}</strong>
          </div>
        </div>

        <div class="reference-note" v-if="lastOrder">
          ⚠️ Importante: al hacer tu transferencia, pon
          <strong>{{ orderCode(lastOrder) }}</strong>
          en el campo "Concepto" o "Referencia" de tu banca en línea. Así identificamos tu pago mucho más rápido.
        </div>

        <a v-if="alternativePaymentLink" :href="alternativePaymentLink" target="_blank" class="alt-link">
          También puedes pagar aquí →
        </a>

        <div class="payment-total">
          <span>Total a pagar</span>
          <strong>${{ lastOrder?.total }}</strong>
        </div>

        <button type="button" class="cta" @click="sendOrderAndProof">
          Enviar pedido + comprobante por WhatsApp
        </button>
        <p class="proof-hint">Se abrirá WhatsApp con todos los datos ya escritos — solo adjunta ahí la foto de tu comprobante.</p>

        <button type="button" class="link-btn" @click="newOrder">Hacer otro pedido</button>
      </div>
    </div>

    <Transition name="toast-fade">
      <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  align-items: start;
}

/* 👉 Tarjeta morada con borde amarillo que envuelve TODO el catálogo
   (título, galería, FAQ, ubicación, formulario) — mismo look que la
   vista previa "Opción B": fondo morado en toda la página y esta
   tarjeta un poco más clara, con borde amarillo grueso. */
.catalog {
  background: var(--panel-card);
  border-radius: var(--radius-lg);
  /* 👉 Antes 3px solid var(--yellow) — un marco muy grueso y saturado
     alrededor de TODO el panel, compitiendo con los botones principales
     por la atención. Se deja más fino y menos saturado, como un borde
     "de contorno" en vez de un marco llamativo. */
  border: 1px solid rgba(250, 204, 21, 0.35);
  padding: 24px;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
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

/* 👉 Tarjeta "Otro Personaje": mismo look que antes tenían los círculos de
   personajes del catálogo (avatar circular + nombre debajo), pero ahora es
   una sola tarjeta clicable que activa/desactiva el campo de texto de abajo. */
.otro-personaje-card {
  position: relative;
  background: white;
  border: 2px dashed var(--pink);
  border-radius: var(--radius-md);
  padding: 14px 10px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 120px;
  transition: 0.15s ease;
  margin-bottom: 8px;
}

.otro-personaje-card:hover {
  border-color: #f3b8d5;
}

.otro-personaje-card.active {
  border-style: solid;
  border-color: var(--pink);
  box-shadow: 0 0 0 3px var(--pink-soft);
}

/* 👉 Misma palomita que las demás opciones seleccionadas (letra/tamaño):
   aparece solo cuando está activo, y desaparece en cuanto se vuelve a
   tocar la tarjeta (porque el click alterna wantsCustomCharacter). */
.otro-personaje-card.active::after {
  content: '✓';
  position: absolute;
  top: -9px;
  right: -9px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--pink);
  color: white;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.otro-personaje-hint {
  margin: 0 0 16px;
  font-size: 11.5px;
  font-weight: 600;
  color: #D9C3E2;
  text-transform: none;
  letter-spacing: normal;
}

.otro-personaje-card .char-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 30px;
}

.otro-personaje-card strong {
  font-size: 14px;
}

.otro-personaje-card .emoji-fallback {
  font-size: 30px;
}

.char-avatar img,
.summary-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.field textarea {
  border: 2px solid var(--pink);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 14px;
  color: var(--ink);
  background: white;
  text-transform: none;
  font-weight: 400;
  letter-spacing: normal;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: 2px solid var(--pink);
  outline-offset: 1px;
}

/* 🔴 Campo obligatorio sin llenar: mismo estilo en compu y en celular. */
.field input.invalid,
.field textarea.invalid {
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

.checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: white;
  cursor: pointer;
}

.checkbox-field input {
  margin-top: 3px;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--pink);
}

.checkbox-field em {
  display: block;
  font-style: normal;
  font-size: 11px;
  color: #D9C3E2;
  margin-top: 2px;
}

.pill-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  background: var(--ink);
  color: white;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.35;
}

.pill.active {
  opacity: 1;
}

.pill.outline {
  background: transparent;
  color: #D9C3E2;
  border: 2px solid rgba(255, 255, 255, 0.25);
  opacity: 1;
}

.pill-check {
  /* 👉 Hereda el color del texto del pill (amarillo cuando está activo,
     ver .pill.outline.active más abajo) para que combine con el borde. */
  color: inherit;
  font-weight: 800;
}

.pill.outline.active {
  border-color: var(--yellow);
  color: var(--yellow);
  background: rgba(250, 204, 21, 0.12);
}

.fixed-shape-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  background: transparent;
  border: 2px dashed var(--yellow);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #D9C3E2;
}

.summary {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px;
  position: sticky;
  top: 20px;
}

.summary h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

/* Botón "✕" para cerrar el panel cuando se muestra como hoja deslizante en
   celular. En escritorio el panel siempre está visible, así que este botón
   se queda oculto (no hace falta cerrarlo). */
.summary-close {
  display: none;
}

/* 🛒 Fondo oscuro detrás del panel: oculto por completo en escritorio,
   donde el pedido ya se ve siempre en su columna lateral. */
.cart-backdrop {
  display: none;
}

@media (max-width: 860px) {
  /* En celular, el panel deja de estar en el flujo normal de la página y se
     convierte en una hoja que sube desde abajo, fija sobre el catálogo, para
     que el cliente no tenga que bajar hasta el final para ver su pedido. */
  .summary {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    top: auto;
    max-height: 80vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.28);
    transform: translateY(calc(100% + 24px));
    transition: transform 0.25s ease;
    z-index: 96;
  }

  .summary.mobile-open {
    transform: translateY(0);
  }

  .summary-close {
    display: flex;
    align-items: center;
    justify-content: center;
    position: sticky;
    top: 0;
    float: right;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: white;
    font-size: 13px;
    margin: -6px -6px 8px 8px;
  }

  .cart-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(32, 26, 43, 0.5);
    z-index: 94;
  }
}

.summary-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--pink-soft);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 18px;
}

.summary-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  overflow: hidden;
}

.muted {
  color: var(--ink-soft);
  font-size: 12px;
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

.package-info {
  margin-top: 4px;
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

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.line {
  display: flex;
  justify-content: space-between;
  color: var(--ink-soft);
}

.free {
  color: var(--green);
  font-weight: 700;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-top: 6px;
}

.total {
  color: var(--pink);
  font-size: 22px;
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

.cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  text-align: center;
  font-size: 12px;
  color: var(--ink-soft);
  margin: 10px 0 0;
}

.error {
  color: #DC2626;
  font-size: 13px;
  margin: 0 0 12px;
}

.success {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-md);
  padding: 14px;
  text-align: center;
}

.success strong {
  display: block;
  margin-bottom: 4px;
}

.success p {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 0 0 10px;
}

.link-btn {
  border: none;
  background: none;
  color: var(--pink);
  font-weight: 700;
  text-decoration: underline;
  display: block;
  margin: 12px auto 0;
}

.payment-overlay {
  position: fixed;
  inset: 0;
  background: rgba(32, 26, 43, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.payment-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 28px;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.payment-head strong {
  font-size: 19px;
  display: block;
  margin-bottom: 4px;
}

.payment-head p {
  color: var(--ink-soft);
  font-size: 13px;
  margin: 0 0 16px;
}

.order-code-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--cream);
  border: 1px dashed #E5B8CE;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--ink-soft);
}

.order-code-box strong {
  font-size: 16px;
  color: var(--pink);
  letter-spacing: 0.04em;
}

.policy {
  background: var(--pink-soft);
  border-radius: var(--radius-md);
  padding: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #831843;
  margin: 0 0 18px;
}

.bank-box {
  background: var(--cream);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.bank-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.bank-row span {
  color: var(--ink-soft);
}

.clabe {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clabe button {
  border: 1px solid var(--border);
  background: white;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}

.alt-link {
  display: block;
  text-align: center;
  font-size: 13px;
  color: var(--pink);
  font-weight: 700;
  text-decoration: none;
  margin-bottom: 14px;
}

.review-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  background: var(--pink-soft);
  border-radius: var(--radius-md);
  padding: 12px;
}

.review-cart-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--cream);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 14px;
  font-size: 13px;
}

.review-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.review-row span {
  color: var(--ink-soft);
  flex-shrink: 0;
}

.review-row strong {
  text-align: right;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  flex: 1;
}

.payment-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 12px 0;
  margin-bottom: 16px;
}

.payment-total strong:last-child {
  color: var(--pink);
  font-size: 20px;
}

.cta.secondary {
  background: var(--ink);
  margin-top: 10px;
}

.proof-hint {
  font-size: 11px;
  color: var(--ink-soft);
  text-align: center;
  margin: 8px 0 0;
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
  /* 👉 Antes tenía white-space: nowrap + sin límite de ancho, así que en
     celular el mensaje largo se salía de la pantalla por los costados.
     Ahora se limita al ancho de la pantalla (con márgenes) y el texto
     baja de línea si hace falta. */
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

/* 🛒 Estilos del carrito */
.add-item-box {
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 8px;
}

.add-cart-btn {
  margin-top: 4px;
}

.empty-cart {
  font-size: 13px;
  color: var(--ink-soft);
  background: var(--cream);
  border-radius: var(--radius-md);
  padding: 14px;
  margin: 0 0 18px;
  line-height: 1.5;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  background: var(--cream);
  border-radius: var(--radius-md);
  padding: 12px;
}

.cart-item strong {
  font-size: 13px;
}

.cart-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cart-item-price {
  font-weight: 700;
  color: var(--pink);
  font-size: 13px;
  white-space: nowrap;
}

.remove-btn {
  border: none;
  background: rgba(220, 38, 38, 0.1);
  color: #DC2626;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 11px;
  line-height: 1;
  flex-shrink: 0;
}

/* Selector con imagen + opción a un lado (tamaños y tipo de letra) */
.option-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  /* 👉 Antes eran tarjetas blancas — sobre el panel morado se veían muy
     "planas" y desconectadas del resto del diseño. Ahora son oscuras y
     translúcidas (blanco al 8% sobre el morado del panel) para que se
     fundan con el fondo en vez de resaltar como un bloque ajeno. */
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-md);
  padding: 10px 14px 10px 10px;
  text-align: left;
  transition: border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
}

.option-row.active {
  border: 2px solid var(--pink);
  background: rgba(236, 72, 153, 0.22);
  /* 👉 Aro de sombra rosa + la palomita en la esquina siguen marcando
     cuál está elegida, ahora sobre el fondo oscuro translúcido. */
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.18);
}

.option-row.active::after {
  content: '✓';
  position: absolute;
  top: -9px;
  right: -9px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--pink);
  color: white;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.option-row-thumb {
  width: 168px;
  height: 112px;
  border-radius: var(--radius-sm);
  /* 👉 Se probó "cover" para quitar el blanco, pero eso le hacía zoom y
     recortaba las fotos que no tienen la misma proporción que el
     recuadro (ej. 4x1.5cm y 5x2cm). Se regresa a "contain" para que la
     foto se vea completa, sin zoom — el blanco se quita dejando el
     fondo transparente en vez de agregar un color de relleno. */
  object-fit: contain;
  flex-shrink: 0;
  background: transparent;
  display: block;
}

.option-row-thumb-wrap {
  position: relative;
  flex-shrink: 0;
}

.option-row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-row-label {
  font-size: 13px;
  font-weight: 700;
  /* 👉 Antes var(--ink) (casi negro), pensado para la tarjeta blanca de
     antes. Con el fondo oscuro translúcido nuevo, el texto necesita ser
     claro para poder leerse. */
  color: white;
}

.option-row-qty {
  font-size: 17px;
  font-weight: 800;
  color: var(--pink);
}

.option-caption {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #D9C3E2;
  margin: 6px 0 0;
}

.field-hint {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #D9C3E2;
  line-height: 1.4;
}
</style>