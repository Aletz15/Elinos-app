<script setup lang="ts">
import { ref } from 'vue'

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
]

const open = ref(false)
const lightboxIndex = ref<number | null>(null)

function openLightbox(i: number) {
  if (examples[i].image) lightboxIndex.value = i
}
function closeLightbox() {
  lightboxIndex.value = null
}
</script>

<template>
  <section class="gallery-wrap">
    <button type="button" class="toggle" @click="open = !open">
      <span>📷 Ver ejemplos de trabajos anteriores</span>
      <span class="chevron" :class="{ rotated: open }">⌄</span>
    </button>

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
      <div v-if="lightboxIndex !== null" class="lightbox" @click="closeLightbox">
        <button type="button" class="lightbox-close" @click="closeLightbox">✕</button>
        <img
          v-if="lightboxIndex !== null && examples[lightboxIndex].image"
          :src="examples[lightboxIndex].image"
        />
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
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.chevron {
  transition: transform 0.15s ease;
  color: var(--ink-soft);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.example-card {
  margin: 0;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.example-card.clickable {
  cursor: zoom-in;
}

.thumb {
  height: 170px;
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
}

.lightbox img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: var(--radius-md);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 16px;
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