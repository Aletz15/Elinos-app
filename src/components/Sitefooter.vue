<script setup lang="ts">
import { LOGO_IMAGE, FACEBOOK_URL } from '../data/branding'
import { buildContactWhatsappLink, buildContactWhatsappCleanLink } from '../lib/whatsapp'

const year = new Date().getFullYear()

// 👉 Abre WhatsApp con el mensaje completo. Se saca del template como
// función normal porque la flecha inline `() => window.open(...)` le
// causaba error de tipos a vue-tsc en el @click.
function openWhatsappSocial() {
  window.open(buildContactWhatsappLink(), '_blank', 'noopener')
}
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

    <div class="footer-social">
      <a
        :href="buildContactWhatsappCleanLink()"
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        @click.prevent="openWhatsappSocial"
      >
        <img src="/icon/whatsapp.png" alt="WhatsApp" />
      </a>
      <a v-if="FACEBOOK_URL" :href="FACEBOOK_URL" target="_blank" rel="noopener" aria-label="Facebook">
        <img src="/icon/facebook.png" alt="Facebook" />
      </a>
    </div>

    <p class="footer-copy">© {{ year }} Elinos</p>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #441058;
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
  color: white;
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

.footer-social {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
}

.footer-social a {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  transition: transform 0.15s ease;
}

.footer-social a:hover {
  transform: scale(1.08);
}

.footer-social img {
  width: 100%;
  height: 100%; 
  object-fit: cover;
}

.footer-copy {
  margin: 0;
  font-size: 12px;
  color: #857CA0;
}
</style>