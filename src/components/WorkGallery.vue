<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLightboxZoom } from '../composables/uselightboxzoom'
import SectionTitle from './SectionTitle.vue'

// 👉 Reemplaza esto con tus trabajos reales:
// pon tus fotos en /public/examples/ y cambia "image" por esa ruta, ej: '/examples/foto1.jpg'
// Puedes agregar tantos ejemplos como quieras, solo copia una línea más.
interface Example {
  emoji: string
  color: string
  image?: string
}

const examples: Example[] = [
  { emoji: '🏷️', color: '#FDE68A', image: '/examples/example1.jpeg' },
  { emoji: '👕', color: '#FED7AA', image: '/examples/example2.jpeg' },
  { emoji: '🎒', color: '#E9D5FF', image: '/examples/example3.jpeg' },
  { emoji: '🧸', color: '#DBEAFE', image: '/examples/example4.jpeg' },
  { emoji: '🏷️', color: '#FBCFE8', image: '/examples/example5.jpeg' },
  { emoji: '🏷️', color: '#FDE68A', image: '/examples/example6.jpeg' },
  { emoji: '🏷️', color: '#FED7AA', image: '/examples/example7.jpeg' },
  // 👉 10 nuevos: copia tus fotos a /public/examples/ con estos nombres
  // (o cambia la ruta si les pones otro nombre) — no hace falta tocar el CSS,
  // la cuadrícula se acomoda sola sin importar cuántas agregues.
  { emoji: '🏷️', color: '#FBCFE8', image: '/examples/8.jpeg' },
  { emoji: '🏷️', color: '#DBEAFE', image: '/examples/9.jpeg' },
  { emoji: '🏷️', color: '#E9D5FF', image: '/examples/10.jpeg' },
  { emoji: '🏷️', color: '#FDE68A', image: '/examples/11.jpeg' },
  { emoji: '🏷️', color: '#FED7AA', image: '/examples/12.jpeg' },
  { emoji: '🏷️', color: '#FBCFE8', image: '/examples/13.jpeg' },
  { emoji: '🏷️', color: '#DBEAFE', image: '/examples/14.jpeg' },
  { emoji: '🏷️', color: '#E9D5FF', image: '/examples/15.jpeg' },
  { emoji: '🏷️', color: '#FDE68A', image: '/examples/16.jpeg' },
  { emoji: '🏷️', color: '#FED7AA', image: '/examples/17.jpeg' },
]

const open = ref(false)
const lightboxIndex = ref<number | null>(null)

// 👉 Zoom y desplazamiento manual dentro del visor (ver el composable
// para el detalle de por qué ya no usamos el zoom nativo del navegador).
const zoom = useLightboxZoom()

function openLightbox(i: number) {
  if (examples[i].image) {
    lightboxIndex.value = i
    zoom.reset()
  }
}
function closeLightbox() {
  lightboxIndex.value = null
  zoom.reset()
}

// 👉 Sin esto, mientras ves la foto en grande el dedo también mueve la
// página de atrás (se nota sobre todo en celular). Bloqueamos el scroll
// del body en cuanto se abre el visor, y lo devolvemos a la normalidad
// en cuanto se cierra.
watch(lightboxIndex, (val) => {
  document.body.style.overflow = val !== null ? 'hidden' : ''
})

// 👉 Con 17 fotos ya no queremos que cierres y vuelvas a tocar cada miniatura
// para ver la siguiente — dentro del visor grande puedes pasar de foto con
// las flechas (◀ ▶) o deslizando el dedo (swipe) en el celular.
function showNext() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % examples.length
  zoom.reset()
}
function showPrev() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value - 1 + examples.length) % examples.length
  zoom.reset()
}

// 👉 Los toques (pellizcar para zoom, arrastrar la foto en zoom) ya los
// resuelve el composable de zoom. Aquí solo nos queda decidir si un toque
// con un dedo, cuando la foto NO está en zoom, fue un "swipe" para pasar
// a la siguiente/anterior — el composable nos dice si ese fue el modo del
// gesto (getMode) y desde dónde empezó (getSwipeStartX).
function onTouchStart(e: TouchEvent) {
  zoom.onTouchStart(e)
}
function onTouchMove(e: TouchEvent) {
  zoom.onTouchMove(e)
}
function onTouchEnd(e: TouchEvent) {
  const wasSwipe = zoom.getMode() === 'swipe'
  const swipeStartX = zoom.getSwipeStartX()
  zoom.onTouchEnd(e)
  if (!wasSwipe) return
  const dx = e.changedTouches[0].clientX - swipeStartX
  if (Math.abs(dx) < 40) return // toque chiquito, no fue swipe
  if (dx < 0) showNext()
  else showPrev()
}
</script>

<template>
  <section class="gallery-wrap">
    <SectionTitle icon="gallery">Trabajos anteriores</SectionTitle>
    <button type="button" class="toggle" @click="open = !open">
      <span>Ver ejemplos de pedidos entregados</span>
      <span class="chevron" :class="{ rotated: open }">⌄</span>
    </button>

    <div v-if="open" class="gallery-heading">
      <h3>Así entregamos tus pedidos</h3>
      <p>¡Listos para usar!</p>
    </div>

    <div v-if="open" class="gallery-grid">
      <figure
        v-for="(ex, i) in examples"
        :key="i"
        class="example-card"
        :class="{ clickable: ex.image }"
        @click="openLightbox(i)"
      >
        <div class="thumb" :style="{ background: ex.color }">
          <img v-if="ex.image" :src="ex.image" loading="lazy" />
          <span v-else class="thumb-emoji">{{ ex.emoji }}</span>
        </div>
      </figure>
    </div>

    <Transition name="fade">
      <div
        v-if="lightboxIndex !== null"
        class="lightbox"
        @click="closeLightbox"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <button
          type="button"
          class="lightbox-close"
          @click="closeLightbox"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        >✕</button>
        <div v-if="lightboxIndex !== null" class="lightbox-counter">
          {{ lightboxIndex + 1 }} / {{ examples.length }}
        </div>
        <button
          type="button"
          class="lightbox-nav prev"
          @click.stop="showPrev"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        >‹</button>
        <img
          v-if="lightboxIndex !== null && examples[lightboxIndex].image"
          :src="examples[lightboxIndex].image"
          :class="{ zoomed: zoom.isZoomed() }"
          :style="{ transform: `translate(${zoom.state.x}px, ${zoom.state.y}px) scale(${zoom.state.scale})` }"
          @click.stop
        />
        <button
          type="button"
          class="lightbox-nav next"
          @click.stop="showNext"
          @touchstart.stop
          @touchmove.stop
          @touchend.stop
        >›</button>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.gallery-wrap {
  margin-bottom: 24px;
}

.toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: 2px solid var(--pink);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--pink);
}

.chevron {
  transition: transform 0.15s ease;
  color: #E8A6C7;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.gallery-heading {
  text-align: center;
  margin-top: 14px;
}

.gallery-heading h3 {
  font-family: 'LetsPlay', sans-serif;
  color: var(--yellow);
  font-size: 22px;
  margin: 0 0 4px;
}

.gallery-heading p {
  font-size: 12px;
  color: #D9C3E2;
  margin: 0;
}

.gallery-grid {
  display: grid;
  /* 👉 Cuadritos chicos en vez de rectángulos altos: en un celular normal
     (~375px de ancho) caben 3 por fila, así que 17 fotos ocupan solo unas
     6 filas de scroll en vez de una lista larguísima de una sola columna. */
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 6px;
  margin-top: 12px;
}

.example-card {
  margin: 0;
  background: white;
  border: 2px solid var(--pink);
  border-radius: 10px;
  overflow: hidden;
}

.example-card.clickable {
  cursor: zoom-in;
}

.thumb {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-emoji {
  font-size: 40px;
}

figcaption {
  font-size: 12px;
  padding: 8px 10px;
  color: var(--ink-soft);
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
  cursor: zoom-out;
  overflow: hidden;
  /* 👉 Apaga el zoom/desplazamiento nativo del navegador dentro del
     visor. Antes, al pellizcar para hacer zoom, el navegador acercaba
     TODA la página (no solo la foto) y como el visor está "position:
     fixed", ese zoom nativo lo descuadraba y se alcanzaba a ver la
     página de atrás. Ahora el navegador ignora esos gestos aquí y el
     zoom lo hacemos nosotros a mano (ver composables/useLightboxZoom.ts),
     moviendo solo la imagen — la página nunca se entera ni se mueve. */
  touch-action: none;
}

.lightbox img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: var(--radius-md);
  touch-action: none;
  /* Sin transición: que responda al instante mientras arrastras/pellizcas. */
  will-change: transform;
  /* 👉 El transform de arriba crea su propio "contexto de apilamiento",
     así que sin esto la imagen podía quedar por encima de la flecha
     izquierda (que va antes que ella en el HTML) aunque la flecha
     derecha sí se viera bien (por ir después). Con z-index explícito
     en la imagen y en los botones, ya no importa el orden del HTML. */
  position: relative;
  z-index: 1;
}

.lightbox img.zoomed {
  cursor: grab;
}

.lightbox-close,
.lightbox-counter,
.lightbox-nav {
  z-index: 2;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 16px;
}

.lightbox-counter {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-nav.prev {
  left: 12px;
}

.lightbox-nav.next {
  right: 12px;
}

/* En celular las flechas estorban menos si van pegadas a los bordes y
   un poco más chicas — el swipe es la forma principal de navegar ahí. */
@media (max-width: 600px) {
  .lightbox-nav {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>