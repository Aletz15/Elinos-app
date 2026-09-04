<script setup lang="ts">
import { businessAddress, businessLandmark, googleMapsEmbedSrc, googleMapsLink } from '../data/location'
import SectionTitle from './SectionTitle.vue'
</script>

<template>
  <section class="location-wrap">
    <SectionTitle icon="pin">Dónde recoger tu pedido</SectionTitle>

    <div class="location-body">
      <div class="location-info">
        <p class="location-address">{{ businessAddress }}</p>
        <p class="location-landmark">{{ businessLandmark }}</p>
        <a
          class="directions-btn"
          :href="googleMapsLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cómo llegar
        </a>
      </div>

      <div class="map-frame">
        <iframe
          :src="googleMapsEmbedSrc"
          width="100%"
          height="100%"
          style="border: 0"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Ubicación del taller en Google Maps"
        ></iframe>
      </div>
    </div>
  </section>
</template>

<style scoped>
.location-wrap {
  margin-bottom: 24px;
  background: transparent;
  border: none;
  padding: 0;
}

.location-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  /* 👉 Antes var(--cream) — se veía como un parche blanco suelto sobre
     el panel morado. Se cambia al mismo fondo oscuro translúcido que ya
     usan las tarjetas de tamaño/letra, para que todo el panel se vea
     consistente. */
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.location-address {
  margin: 0;
  font-size: 13px;
  /* 👉 Antes var(--ink-soft), un gris oscuro pensado para fondo claro.
     Con el fondo oscuro nuevo necesita ser un tono claro para leerse. */
  color: #D9C3E2;
  line-height: 1.5;
}

.location-landmark {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--pink);
}

.directions-btn {
  flex-shrink: 0;
  background: var(--pink);
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  white-space: nowrap;
}

.map-frame {
  width: 100%;
  height: 220px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@media (min-width: 480px) {
  .location-info {
    flex-wrap: nowrap;
  }
}
</style>