<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { LOGO_IMAGE, CART_ICON_IMAGE } from './data/branding'
import { cartCount, mobileCartOpen } from './lib/cart'
import SiteFooter from './components/Sitefooter.vue'

const route = useRoute()
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
      <!-- Sin barra de navegación pública a propósito: el panel (/panel) es
           solo para el administrador y ya está protegido con contraseña.
           Los clientes que entran a la página principal solo ven el catálogo. -->
      <span v-if="route.path === '/panel'" class="admin-tag">Vista de administrador</span>

      <!-- 🛒 Ícono del carrito: solo en la página del catálogo, y solo en
           celular (en escritorio el pedido ya se ve siempre en su columna
           lateral, así que este ícono estorbaría). Abre el mismo panel
           deslizante "Tu pedido" que ya existe en CatalogView.vue. -->
      <button
        v-if="route.path === '/'"
        type="button"
        class="header-cart"
        @click="mobileCartOpen = !mobileCartOpen"
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
  /* 👉 Header pegajoso: se queda pegado arriba mientras se hace scroll.
     Los márgenes negativos lo sacan del padding de .shell para que llegue
     de borde a borde de la pantalla (como una barra de app), y el padding
     interno recupera la separación visual del contenido. */
  position: sticky;
  top: 0;
  z-index: 45;
  margin: -24px -20px 28px;
  padding: 14px 20px;
  background: var(--brand-purple);
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