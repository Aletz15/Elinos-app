<script setup lang="ts">
import { ref } from 'vue'
import { howToSteps, TUTORIAL_VIDEO } from '../data/howto'

const open = ref(false)
</script>

<template>
  <section class="howto-wrap">
    <button type="button" class="toggle" @click="open = !open">
      <span>¿Cómo se aplica la etiqueta?</span>
      <span class="chevron" :class="{ rotated: open }">⌄</span>
    </button>

    <div v-if="open" class="howto-content">
      <video v-if="TUTORIAL_VIDEO" class="howto-video" :src="TUTORIAL_VIDEO" controls playsinline></video>

      <ol class="howto-steps">
        <li v-for="(step, i) in howToSteps" :key="i">
          <span class="step-num">{{ i + 1 }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.howto-wrap {
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

.howto-content {
  margin-top: 12px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.howto-video {
  width: 100%;
  max-width: 320px;
  border-radius: var(--radius-md);
  display: block;
  margin: 0 auto 16px;
}

.howto-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.howto-steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--pink-soft);
  color: var(--pink);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.howto-steps strong {
  font-size: 13px;
  display: block;
}

.howto-steps p {
  font-size: 12px;
  color: var(--ink-soft);
  margin: 2px 0 0;
}
</style>
