<script setup lang="ts">
import { whyChooseIntro, whyChooseItems } from '../data/whyChooseUs'
import SectionTitle from './SectionTitle.vue'
</script>

<template>
  <section class="why-wrap">
    <SectionTitle icon="heart">¿Por qué elegir Elinos?</SectionTitle>

    <h3 class="why-tagline">Diseño con amor, paciencia y calidad superior.</h3>
    <p class="why-intro">{{ whyChooseIntro }}</p>

    <ul class="why-list">
      <li v-for="(item, i) in whyChooseItems" :key="i" class="why-item">
        <span class="why-emoji">{{ item.emoji }}</span>
        <span class="why-text">
          <strong>{{ item.title }}:</strong> {{ item.description }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.why-wrap {
  margin-bottom: 24px;
}

.why-tagline {
  font-family: 'LetsPlay', sans-serif;
  color: var(--yellow);
  font-size: 19px;
  margin: 0 0 8px;
  line-height: 1.3;
}

.why-intro {
  font-size: 13.5px;
  color: #D9C3E2;
  line-height: 1.6;
  margin: 0 0 14px;
}

.why-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 👉 A propósito SIN borde/marco por ítem — es una lista de valores, no
   otra tarjeta seleccionable más. Así no se suma al "ruido" visual de
   marcos que ya se redujo en el resto de la página. */
.why-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.why-emoji {
  font-size: 17px;
  line-height: 1.5;
  flex-shrink: 0;
}

.why-text {
  font-size: 13.5px;
  color: #D9C3E2;
  line-height: 1.6;
}

.why-text strong {
  color: white;
  font-weight: 700;
}
</style>