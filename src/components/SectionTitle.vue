<script setup lang="ts">
import { computed } from 'vue'

// 👉 Título de sección reutilizable: pill amarilla + circulito morado
// ("dot") con un icono a la izquierda + texto morado oscuro en negritas.
//
// Formas de poner el icono dentro del dot:
//
// 1) Con uno de nuestros iconos propios (líneas simples, se pintan del
//    mismo amarillo siempre, sin depender de cómo el celular dibuje un
//    emoji a color):
//      <SectionTitle icon="ruler">Tamaño</SectionTitle>
//    Iconos disponibles: character, font, ruler, shape, notes, info, pin, gallery, heart
//
// 2) Con tu propia imagen (como el ícono de FAQ). Se "recorta" (mask) y
//    se pinta del mismo amarillo, para que se vea igual de parejo sin
//    importar de qué color venga tu PNG original:
//      <SectionTitle icon-image="/icons/faq.png">Preguntas frecuentes</SectionTitle>
//
// Si esta sección debe llevar la línea divisoria de arriba (la que separa
// un campo del siguiente, como entre "Tipo de letra" y "Tamaño"), agrega
// la prop "divider":
//   <SectionTitle icon="ruler" divider>Tamaño</SectionTitle>
const props = defineProps<{
  icon?: string
  iconImage?: string
  divider?: boolean
}>()

// 👉 Iconos de línea simple (sin relleno de color fijo) para que TODOS
// los títulos se vean parejos: mismo grosor, mismo tamaño, mismo
// amarillo. Si quieres agregar uno nuevo, copia el patrón de cualquiera
// de estos (viewBox 24x24, stroke="currentColor").
const svgIcons: Record<string, string> = {
  character: `
    <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M5 19c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `,
  ruler: `
    <rect x="3" y="9" width="18" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="7" y1="9" x2="7" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="11" y1="9" x2="11" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="15" y1="9" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>
  `,
  shape: `
    <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
  `,
  notes: `
    <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="7.5" y1="9" x2="16.5" y2="9" stroke="currentColor" stroke-width="1.6"/>
    <line x1="7.5" y1="13" x2="16.5" y2="13" stroke="currentColor" stroke-width="1.6"/>
    <line x1="7.5" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.6"/>
  `,
  info: `
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="11" x2="12" y2="16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="7.7" r="1.15" fill="currentColor"/>
  `,
  pin: `
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="12" cy="9.5" r="2.1" fill="currentColor"/>
  `,
  gallery: `
    <rect x="3" y="4.5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="8" cy="9.3" r="1.4" fill="currentColor"/>
    <path d="M4.5 15.5l4.3-4.3a1.2 1.2 0 0 1 1.7 0l2 2 2.6-2.6a1.2 1.2 0 0 1 1.7 0l3.2 3.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  heart: `
    <path d="M12 20s-7.1-4.4-9.4-8.6C1.1 8.3 2.7 5 6.1 5c1.9 0 3.5 1 4.4 2.5C11.4 6 13 5 14.9 5c3.4 0 5 3.3 3.5 6.4C16.1 15.6 12 20 12 20Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  `,
}

const svgMarkup = computed(() => (props.icon ? svgIcons[props.icon] : undefined))
const isFontIcon = computed(() => props.icon === 'font')
const isLiteralIcon = computed(() => !!props.icon && !svgMarkup.value && !isFontIcon.value)

// 👉 Vue permite usar variables de <script setup> directo dentro de
// <style> con v-bind(...) — así el CSS de abajo sabe qué imagen usar
// como mascara sin tener que escribir un :style a mano en el template.
const maskUrl = computed(() => (props.iconImage ? `url(${props.iconImage})` : 'none'))
</script>

<template>
  <div class="section-title-wrap" :class="{ 'with-divider': divider }">
    <h2 class="section-title">
      <span v-if="iconImage || svgMarkup || isFontIcon || isLiteralIcon" class="section-title-dot">
        <span v-if="iconImage" class="section-title-dot-img"></span>
        <svg v-else-if="svgMarkup" class="section-title-svg" viewBox="0 0 24 24" v-html="svgMarkup"></svg>
        <span v-else-if="isFontIcon" class="section-title-font">Aa</span>
        <span v-else class="section-title-emoji">{{ icon }}</span>
      </span>
      <span class="section-title-text"><slot /></span>
    </h2>
  </div>
</template>

<style scoped>
.section-title-wrap {
  margin-bottom: 14px;
}

.section-title-wrap.with-divider {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 16px 6px 8px;
  background: var(--yellow);
  border-radius: 999px;
  /* 👉 Por si esta pill se usa dentro de un .field (que pone el texto en
     mayúsculas chiquitas por default) — nos aseguramos de que siempre se
     vea igual sin importar dónde se use. */
  text-transform: none;
  letter-spacing: normal;
}

.section-title-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--brand-purple);
  color: var(--yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

.section-title-svg {
  width: 13px;
  height: 13px;
}

.section-title-font {
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

.section-title-emoji {
  font-size: 11px;
}

.section-title-dot-img {
  width: 12px;
  height: 12px;
  background-color: var(--yellow);
  -webkit-mask-image: v-bind(maskUrl);
  mask-image: v-bind(maskUrl);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

.section-title-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--brand-purple);
  line-height: 1.2;
}
</style>