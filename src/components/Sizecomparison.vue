<script setup lang="ts">
import type { SizeOption } from '../types'

const props = defineProps<{
  sizes: SizeOption[]
  selectedId?: string
}>()

// 👉 Escala: cuántos píxeles representa cada centímetro real. Con esto las
// cajitas quedan proporcionales entre sí (5x2 se ve más grande que 4x1.5,
// tal como en la vida real) — no son tamaños inventados a ojo.
const SCALE = 34

function boxWidth(s: SizeOption) {
  return Math.round(s.widthCm * SCALE)
}
function boxHeight(s: SizeOption) {
  return Math.round(s.heightCm * SCALE)
}
</script>

<template>
  <div class="size-compare">
    <p class="size-compare-title">Compara los tamaños</p>
    <div class="size-compare-row">
      <div
        v-for="s in props.sizes"
        :key="s.id"
        class="size-compare-item"
        :class="{ active: s.id === props.selectedId }"
      >
        <img
          v-if="s.compareImage"
          :src="s.compareImage"
          :alt="s.label"
          class="size-compare-box"
          :style="{ width: boxWidth(s) + 'px', height: boxHeight(s) + 'px' }"
        />
        <div
          v-else
          class="size-compare-box"
          :style="{ width: boxWidth(s) + 'px', height: boxHeight(s) + 'px' }"
        />
        <div class="size-compare-caption">
          <strong>{{ s.widthCm }} x {{ s.heightCm }} cm</strong>
          <span>{{ s.piecesPerPackage }} pzas</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.size-compare {
  /* 👉 Antes var(--pink-soft), un rosa casi blanco — se veía como el
     mismo bloque claro que las tarjetas de arriba. Ahora usa el mismo
     fondo oscuro translúcido para fundirse con el panel morado. */
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-md);
  padding: 16px 14px 14px;
  margin-bottom: 16px;
}

.size-compare-title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  text-align: center;
}

.size-compare-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.size-compare-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.size-compare-box {
  display: block;
  background: transparent;
  /* 👉 Antes el borde rosa estaba puesto siempre, en todas las cajitas
     por igual — por eso no se notaba cuál cambiaba al seleccionar una
     medida distinta. Ahora las no-seleccionadas llevan un borde neutro
     (blanco tenue) y solo la activa se pone rosa. */
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  object-fit: cover;
  transition: 0.15s ease;
}

.size-compare-item.active .size-compare-box {
  border-color: var(--pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.45);
  /* 👉 Además del borde y el aro de sombra, un ligero zoom hace que sea
     imposible no notar cuál está seleccionada. */
  transform: scale(1.06);
}

.size-compare-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
}

.size-compare-caption strong {
  font-size: 12px;
  color: white;
}

.size-compare-caption span {
  font-size: 11px;
  color: #D9C3E2;
}

.size-compare-item.active .size-compare-caption strong {
  color: var(--pink);
}
</style>