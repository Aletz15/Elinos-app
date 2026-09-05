<script setup lang="ts">
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { LOGO_IMAGE, CART_ICON_IMAGE } from './data/branding'
import { cartCount, mobileCartOpen } from './lib/cart'
import { buildContactWhatsappLink, buildContactWhatsappCleanLink } from './lib/whatsapp'
import SiteFooter from './components/Sitefooter.vue'

const route = useRoute()
const router = useRouter()

// 🛒 El panel deslizante "Tu pedido" solo existe dentro de CatalogView.vue
// (la vista de '/'). Si el cliente está en /paquetes y toca el carrito,
// primero lo mandamos a '/' y AHÍ SÍ abrimos el panel — mobileCartOpen es
// compartido (../lib/cart.ts), así que ya aparece abierto en cuanto carga.
function openCart() {
  mobileCartOpen.value = true
  if (route.path !== '/') router.push('/')
}

// 👉 Abre WhatsApp con el mensaje completo. Se saca del template como
// función normal porque la flecha inline `() => window.open(...)` le
// causaba error de tipos a vue-tsc en el @click.
function openWhatsappFab() {
  window.open(buildContactWhatsappLink(), '_blank', 'noopener')
}

// 💬 Globito con mensaje corto sobre el botón de WhatsApp, para invitar
// a la gente a escribir sin que el botón solo (sin texto) pase
// desapercibido. Reglas:
// - Aparece solo, con un pequeño retraso (no de golpe al cargar).
// - Se puede cerrar con la X.
// - Si lo cierran, no vuelve a salir por unos días (se guarda la fecha
//   en localStorage) — así no resulta repetitivo en cada visita.
const WHATSAPP_BUBBLE_KEY = 'elinos_whatsapp_bubble_dismissed_at'
const WHATSAPP_BUBBLE_SNOOZE_DAYS = 7
const showWhatsappBubble = ref(false)

function dismissWhatsappBubble() {
  showWhatsappBubble.value = false
  localStorage.setItem(WHATSAPP_BUBBLE_KEY, String(Date.now()))
}

onMounted(() => {
  const dismissedAt = Number(localStorage.getItem(WHATSAPP_BUBBLE_KEY) ?? 0)
  const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  if (daysSinceDismissed < WHATSAPP_BUBBLE_SNOOZE_DAYS) return

  setTimeout(() => {
    showWhatsappBubble.value = true
  }, 2500)
})
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-badge">
          <img v-if="LOGO_IMAGE" :src="LOGO_IMAGE" alt="Elinos" />
          <template v-else>E</template>
        </span>
        <div class="brand-text">
          <strong>Elinos</strong>
          <span>Etiquetas planchables</span>
        </div>
      </div>
      <!-- 🧭 Nav pública simple: solo "Catálogo" y "Paquetes" — el panel
           (/panel) es solo para el administrador y no aparece aquí, ya está
           protegido con contraseña aparte. -->
      <nav v-if="route.path !== '/panel'" class="main-nav">
        <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Catálogo</RouterLink>
        <RouterLink to="/paquetes" class="nav-link" :class="{ active: route.path === '/paquetes' }">📦 Paquetes</RouterLink>
      </nav>
      <span v-if="route.path === '/panel'" class="admin-tag">Vista de administrador</span>

      <!-- 🛒 Ícono del carrito: en celular en ambas páginas públicas (en
           escritorio el pedido ya se ve siempre en su columna lateral
           DENTRO de CatalogView.vue, así que en /paquetes en escritorio no
           hay columna — el ícono de aquí es la única forma de llegar a
           revisar el pedido sin tocar "Ir a mi pedido y finalizar"). -->
      <button
        v-if="route.path === '/' || route.path === '/paquetes'"
        type="button"
        class="header-cart"
        @click="openCart"
        aria-label="Ver mi pedido"
      >
        <img :src="CART_ICON_IMAGE" alt="Carrito" />
        <span v-if="cartCount" class="header-cart-badge">{{ cartCount }}</span>
      </button>
    </header>
    
    <main>
      <RouterView />
    </main>
    <SiteFooter />

    <!-- 📱 Botón flotante de WhatsApp: fijo abajo a la derecha en toda la
         página (menos en /panel, que es solo para el administrador). Abre
         un chat directo al número del taller, sin datos de ningún pedido.
         👉 El href que se ve al pasar el mouse es la versión "limpia"
         (sin el texto), pero el @click.prevent cancela esa navegación y
         abre la versión completa con el mensaje precargado. -->
    <div v-if="route.path !== '/panel'" class="whatsapp-fab-wrap">
      <transition name="bubble-pop">
        <div v-if="showWhatsappBubble" class="whatsapp-bubble">
          <button
            type="button"
            class="whatsapp-bubble-close"
            aria-label="Cerrar mensaje"
            @click="dismissWhatsappBubble"
          >
            ✕
          </button>
          <span>¿Dudas? Escríbenos 😊</span>
        </div>
      </transition>
      <a
        class="whatsapp-fab"
        :href="buildContactWhatsappCleanLink()"
        target="_blank"
        rel="noopener"
        aria-label="Escríbenos por WhatsApp"
        @click.prevent="openWhatsappFab"
      >
        <img src="/icon/whatsapp.png" alt="WhatsApp" />
      </a>
    </div>
  </div>
</template>

<style scoped>
.shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 45;
  margin: -24px -20px 28px;
  padding: 14px 20px;
  background: #441058;
  border-bottom: 4px solid var(--pink);
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-badge {
  width: 100px;
  height: 100px;
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

.brand-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-text strong {
  font-size: 18px;
  color: var(--yellow);
  font-family: 'LetsPlay', 'Segoe UI', sans-serif;
}

.brand-text span {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.admin-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--ink);
  color: white;
  padding: 6px 14px;
  border-radius: 999px;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 8px 16px;
  border-radius: 999px;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.32);
}

.nav-link:active {
  transform: scale(0.96);
}

.nav-link.active {
  color: var(--brand-purple);
  background: var(--yellow);
  border-color: var(--yellow);
}

.nav-link.active:hover {
  background: var(--yellow);
  border-color: var(--yellow);
}

@media (max-width: 860px) {
  .nav-link {
    font-size: 12px;
    padding: 7px 12px;
  }
}

/* 🛒 Oculto por completo en escritorio: el pedido ya se ve siempre en su
   columna lateral, así que este ícono solo hace falta en celular. */
.header-cart {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: var(--pink-soft);
  flex-shrink: 0;
  /* 👉 Anillo de resaltado por fuera del círculo (sin ocupar espacio extra):
     el primer valor es un aro fino pegado al círculo, el segundo es el aro
     de color más ancho por fuera de ese. Ajusta los colores/anchos (3px y
     6px) a tu gusto. */
  box-shadow: 0 0 0 3px var(--cream), 0 0 0 6px var(--pink);
}

.header-cart img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.header-cart-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pink);
  color: white;
  border: 2px solid var(--cream);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.whatsapp-fab-wrap {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.whatsapp-bubble {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--cream);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 30px 10px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

/* Colita del globito, apuntando hacia el botón de WhatsApp de abajo. */
.whatsapp-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 22px;
  width: 12px;
  height: 12px;
  background: var(--cream);
  transform: rotate(45deg);
}

.whatsapp-bubble-close {
  position: absolute;
  top: 5px;
  right: 6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  color: var(--ink-soft);
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bubble-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.bubble-pop-enter-from,
.bubble-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.95);
}

.whatsapp-fab {
  position: static;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.whatsapp-fab:hover {
  transform: scale(1.06);
}

.whatsapp-fab img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 860px) {
  /* En celular el logo se achica bastante: al quedar pegado arriba todo el
     tiempo, uno de 100px se comería demasiada pantalla del catálogo. */
  .brand-badge {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    font-size: 16px;
  }

  .brand-text strong {
    font-size: 25px;
  }

  .brand-text span {
    font-size: 9px;
  }

  .header-cart {
    display: flex;
  }
}
</style>