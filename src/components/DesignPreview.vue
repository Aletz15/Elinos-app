<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  emoji: string
  color: string
  name: string
  shapeId: string
  sizeId?: string
  image?: string
  fontFamily?: string
  widthCm?: number
  heightCm?: number
}>()

// El recuadro blanco alrededor del nombre solo aplica para la medida 3x2 cm;
// en las demás medidas el nombre va directo sobre el color, sin caja blanca.
const hasNameBox = computed(() => props.sizeId === '3x2')

// La caja de color usa un tamaño aproximado fijo por medida (no una fórmula),
// para controlar directo qué tan grande se ve cada una. 3x2 queda igual que
// antes (240x160); 4x1.5 y 5x2 se ajustaron para que 5x2 se vea más grande
// que 4x1.5, como corresponde (5x2 tiene más área real que 4x1.5).
const SIZE_PREVIEW_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '3x2': { width: 240, height: 160 },
  '4x1.5': { width: 260, height: 100 },
  '5x2': { width: 280, height: 120 },
}
const previewWidth = computed(
  () => SIZE_PREVIEW_DIMENSIONS[props.sizeId ?? '3x2']?.width ?? 240
)
const previewMinHeight = computed(
  () => SIZE_PREVIEW_DIMENSIONS[props.sizeId ?? '3x2']?.height ?? 160
)

// El personaje también se achica en las medidas más angostas (4x1.5, 5x2),
// para que la caja completa refleje la diferencia real y no quede "tapada"
// por un personaje de tamaño fijo.
const previewImageSize = computed(() => {
  const available = previewMinHeight.value - 24 // deja espacio para el padding de la caja
  return Math.max(48, Math.min(100, available))
})

const nameFontFamily = computed(() => props.fontFamily || 'inherit')
</script>

<template>
  <div class="preview-wrap">
    <div
      class="preview-shape"
      :class="shapeId"
      :style="{ background: color, width: previewWidth + 'px', minHeight: previewMinHeight + 'px' }"
    >
      <div class="preview-character">
        <img
          v-if="image"
          class="preview-image"
          :src="image"
          alt=""
          :style="{ width: previewImageSize + 'px', height: previewImageSize + 'px' }"
        />
        <span v-else class="preview-emoji" :style="{ fontSize: Math.round(previewImageSize * 0.4) + 'px' }">{{ emoji }}</span>
      </div>

      <div class="preview-name-box" :class="{ plain: !hasNameBox }">
        <span class="preview-name" :style="{ fontFamily: nameFontFamily }">{{ name || 'Nombre' }}</span>
      </div>
    </div>
    <p class="preview-caption">Vista previa aproximada</p>
  </div>
</template>

<style scoped>
.preview-wrap {
  text-align: center;
  margin-bottom: 18px;
}

.preview-shape {
  margin: 0 auto 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.preview-shape.ovalado {
  border-radius: 50%;
}

.preview-shape.redondo {
  border-radius: 50%;
}

.preview-shape.rectangular {
  border-radius: 4px;
}

.preview-shape.rectangular-redondeado {
  border-radius: 14px;
}

.preview-shape.dinosaurio {
  border-radius: 14px 40px 14px 40px;
}

.preview-character {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-emoji {
  font-size: 40px;
  line-height: 1;
}

.preview-image {
  object-fit: contain;
}

/* Recuadro blanco SOLO para el nombre, dentro de la caja de color */
.preview-name-box {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 10px;
  padding: 8px 10px;
  align-self: stretch;
}

.preview-name-box.plain {
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.preview-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.15;
  overflow-wrap: break-word;
  word-break: break-word;
  text-align: center;
}

.preview-caption {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
  margin: 0;
}
</style>