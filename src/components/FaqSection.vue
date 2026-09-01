<script setup lang="ts">
import { ref } from 'vue'
import { faqItems } from '../data/faq'

const openIndex = ref<number | null>(null)
function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}
</script>

<template>
  <section class="faq-wrap">
    <h2 class="faq-title">Preguntas frecuentes</h2>
    <div class="faq-list">
      <div v-for="(item, i) in faqItems" :key="i" class="faq-item">
        <button type="button" class="faq-question" @click="toggle(i)">
          <span>{{ item.question }}</span>
          <span class="chevron" :class="{ rotated: openIndex === i }">⌄</span>
        </button>
        <!-- 👉 v-html porque ahora las respuestas en data/faq.ts pueden traer
             <strong> para negritas (ver ejemplo ahí). Este texto lo escribes
             tú en el código, nunca viene de lo que escribe un cliente, así
             que es seguro. -->
        <div v-if="openIndex === i" class="faq-answer" v-html="item.answer"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-wrap {
  margin-bottom: 24px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px 16px;
}

.faq-title {
  font-size: 16px;
  margin: 0 0 14px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-item {
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
}

.faq-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  padding: 12px 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  text-align: left;
  line-height: 1.4;
}

.chevron {
  color: var(--ink-soft);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 4px 16px;
  font-size: 13.5px;
  color: var(--ink-soft);
  line-height: 1.7;
  /* 👉 Respeta los saltos de línea (\n) que escribas en data/faq.ts, para
     poder separar la respuesta en varias líneas/párrafos cortos en vez de
     un bloque de texto amontonado. */
  white-space: pre-line;
}
</style>