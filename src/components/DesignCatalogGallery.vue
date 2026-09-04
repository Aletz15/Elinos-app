<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLightboxZoom } from '../composables/uselightboxzoom'

const designs: string[] = [
  '/examples/otrosdiseños.jpeg',
  '/examples/otrosdiseños2.jpeg',
]

const open = ref(false)
const lightboxIndex = ref<number | null>(null)

// 👉 Zoom y desplazamiento manual dentro del visor (mismo patrón que
// "Trabajos anteriores" — ver composables/useLightboxZoom.ts para el
// detalle de por qué ya no usamos el zoom nativo del navegador).
const zoom = useLightboxZoom()

function openLightbox(i: number) {
  lightboxIndex.value = i
  zoom.reset()
}
function closeLightbox() {
  lightboxIndex.value = null
  zoom.reset()
}

watch(lightboxIndex, (val) => {
  document.body.style.overflow = val !== null ? 'hidden' : ''
})

// 👉 Mismo patrón que ya quedó en "Trabajos anteriores": flechas y swipe
// para pasar de una foto a otra sin cerrar el visor cada vez.
function showNext() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % designs.length
  zoom.reset()
}
function showPrev() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value - 1 + designs.length) % designs.length
  zoom.reset()
}

// 👉 El pellizco para zoom y el arrastre de la foto ya en zoom los
// resuelve el composable. Aquí solo decidimos si un toque con un dedo,
// con la foto en tamaño normal, fue un "swipe" para cambiar de foto.
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
  if (Math.abs(dx) < 40) return
  if (dx < 0) showNext()
  else showPrev()
}
</script>

<template>
  <section class="design-catalog-wrap">
    <button type="button" class="toggle" @click="open = !open">
      <span>🖼️ Catálogo de diseños</span>
      <span class="chevron" :class="{ rotated: open }">⌄</span>
    </button>

    <div v-if="open" class="design-catalog-grid">
      <figure
        v-for="(img, i) in designs"
        :key="i"
        class="design-card"
        @click="openLightbox(i)"
      >
        <div class="thumb">
          <img :src="img" loading="lazy" />
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
        <button type="button" class="lightbox-close" @click="closeLightbox">✕</button>
        <div v-if="lightboxIndex !== null" class="lightbox-counter">
          {{ lightboxIndex + 1 }} / {{ designs.length }}
        </div>
        <button type="button" class="lightbox-nav prev" @click.stop="showPrev">‹</button>
        <img
          v-if="lightboxIndex !== null"
          :src="designs[lightboxIndex]"
          :class="{ zoomed: zoom.isZoomed() }"
          :style="{ transform: `translate(${zoom.state.x}px, ${zoom.state.y}px) scale(${zoom.state.scale})` }"
          @click.stop
        />
        <button type="button" class="lightbox-nav next" @click.stop="showNext">›</button>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.design-catalog-wrap {
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

.design-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.design-card {
  margin: 0;
  background: white;
  border: 2px solid var(--pink);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: zoom-in;
}

.thumb {
  height: 220px;
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
     visor. Antes, al pellizcar, el navegador acercaba TODA la página (no
     solo la foto) y como el visor es "position: fixed", eso lo
     descuadraba y se veía la página de atrás. Ahora el zoom lo hacemos
     nosotros a mano (ver composables/useLightboxZoom.ts), moviendo solo
     la imagen — la página nunca se mueve. */
  touch-action: none;
}

.lightbox img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: var(--radius-md);
  touch-action: none;
  will-change: transform;
  /* 👉 Mismo arreglo que en "Trabajos anteriores": el transform crea su
     propio contexto de apilamiento y sin z-index explícito la imagen
     tapaba la flecha izquierda (va antes que ella en el HTML). */
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