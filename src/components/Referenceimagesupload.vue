<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: File[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void
}>()

const MAX_FILES = 3
const MAX_SIZE_MB = 8

const fileInput = ref<HTMLInputElement | null>(null)
const errorMsg = ref('')

// Vistas previas locales (no se sube nada todavía; solo se sube cuando se
// envía el pedido, en CatalogView.vue).
const previews = computed(() =>
  props.modelValue.map((file) => ({ file, url: URL.createObjectURL(file) }))
)

function openPicker() {
  errorMsg.value = ''
  fileInput.value?.click()
}

function onFilesSelected(e: Event) {
  errorMsg.value = ''
  const input = e.target as HTMLInputElement
  const chosen = Array.from(input.files ?? [])
  input.value = '' // para poder volver a elegir el mismo archivo si lo quita y lo agrega otra vez

  const room = MAX_FILES - props.modelValue.length
  if (room <= 0) {
    errorMsg.value = `Máximo ${MAX_FILES} imágenes.`
    return
  }

  const accepted: File[] = []
  for (const file of chosen) {
    if (accepted.length >= room) break
    if (!file.type.startsWith('image/')) {
      errorMsg.value = 'Solo se aceptan imágenes (png, jpg).'
      continue
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      errorMsg.value = `Cada imagen debe pesar menos de ${MAX_SIZE_MB}MB.`
      continue
    }
    accepted.push(file)
  }

  if (accepted.length > 0) {
    emit('update:modelValue', [...props.modelValue, ...accepted])
  }
}

function removeFile(index: number) {
  const next = props.modelValue.slice()
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="ref-images-field">
    <span class="ref-images-label">Imágenes de referencia o diseño que te gustó (opcional, máx. {{ MAX_FILES }})</span>

    <div class="ref-images-row">
      <div v-for="(p, i) in previews" :key="i" class="ref-thumb">
        <img :src="p.url" :alt="p.file.name" />
        <button type="button" class="ref-thumb-remove" @click="removeFile(i)" aria-label="Quitar imagen">✕</button>
      </div>

      <button
        v-if="modelValue.length < MAX_FILES"
        type="button"
        class="ref-add-btn"
        @click="openPicker"
      >
        <span>+</span>
        <small>Agregar</small>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg"
      multiple
      class="ref-hidden-input"
      @change="onFilesSelected"
    />

    <p v-if="errorMsg" class="ref-error">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.ref-images-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.ref-images-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--yellow);
}

.ref-images-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ref-thumb {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}

.ref-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ref-thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 11px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ref-add-btn {
  width: 84px;
  height: 84px;
  border-radius: var(--radius-sm);
  border: 2px dashed var(--pink);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--pink);
  gap: 2px;
}

.ref-add-btn span {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.ref-add-btn small {
  font-size: 10px;
  color: #D9C3E2;
}

.ref-hidden-input {
  display: none;
}

.ref-error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}
</style>