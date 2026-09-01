<script setup lang="ts">
import { LOGO_IMAGE } from '../data/branding'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-brand">
      <span class="footer-badge">
        <img v-if="LOGO_IMAGE" :src="LOGO_IMAGE" alt="Elinos" />
        <template v-else>E</template>
      </span>
      <div class="footer-text">
        <strong>Elinos</strong>
        <span>Etiquetas planchables · Mérida, Yuc.</span>
      </div>
    </div>

    <div class="footer-divider" />

    <p class="footer-copy">© {{ year }} Elinos</p>
  </footer>
</template>

<style scoped>
.site-footer {
  background: var(--panel-dark);
  border-radius: var(--radius-lg);
  padding: 36px 24px 28px;
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-badge {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--pink);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 26px;
  overflow: hidden;
  flex-shrink: 0;
}

.footer-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.footer-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.footer-text strong {
  font-size: 18px;
  color: var(--yellow);
  font-family: 'LetsPlay', 'Segoe UI', sans-serif;
}

.footer-text span {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #C9C3DA;
}

.footer-divider {
  width: 48px;
  height: 2px;
  background: var(--pink);
  border-radius: 2px;
  margin: 22px 0 16px;
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: #857CA0;
}
</style>