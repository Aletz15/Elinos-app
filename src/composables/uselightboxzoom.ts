import { reactive } from 'vue'

// 👉 Zoom y desplazamiento manual (con los dedos) para el visor de fotos
// en grande (el "lightbox" que se abre al tocar una miniatura).
//
// EL PROBLEMA que resuelve esto: antes dejábamos que el usuario hiciera
// zoom con el gesto normal del navegador (pellizcar con dos dedos). El
// problema es que ese zoom es de TODA la página, no solo de la foto — y
// como el visor está fijo en pantalla (position: fixed), el zoom nativo
// del navegador "descuadra" el visor y, al arrastrar el dedo, se alcanza
// a ver la página de atrás (las miniaturas) por debajo. Es un bug
// conocido de position:fixed + zoom nativo en navegadores de celular.
//
// LA SOLUCIÓN: apagamos el zoom nativo del navegador (con
// `touch-action: none` en el CSS del visor) y hacemos nuestro propio zoom
// aquí, moviendo y agrandando SOLO la imagen con `transform`. La página
// de atrás nunca se entera de que hubo zoom, así que nunca se mueve ni se
// asoma.
//
// CÓMO SE USA dentro de un componente:
//
//   const zoom = useLightboxZoom()
//
//   <div class="lightbox"
//        @touchstart="zoom.onTouchStart"
//        @touchmove="zoom.onTouchMove"
//        @touchend="zoom.onTouchEnd">
//     <img :style="{ transform: `translate(${zoom.state.x}px, ${zoom.state.y}px) scale(${zoom.state.scale})` }" ... />
//
// Llama zoom.reset() cada vez que cambias de foto (showNext/showPrev) o
// cierras el visor, para que la siguiente foto empiece sin zoom.
// Usa zoom.isZoomed() en vez del swipe (deslizar para cambiar de foto)
// mientras la foto está acercada — si no, un dedo moviéndose dentro de la
// foto en zoom se confundiría con "quiero ver la siguiente".

const MAX_SCALE = 4
const MIN_SCALE = 1
const DOUBLE_TAP_ZOOM = 2.5
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_RADIUS_PX = 30
const SNAP_BACK_THRESHOLD = 1.01

type Mode = 'none' | 'pinch' | 'pan' | 'swipe'

export function useLightboxZoom() {
  const state = reactive({
    scale: 1,
    x: 0,
    y: 0,
  })

  // Qué gesto está en curso ahora mismo. El propio componente que usa
  // este composable revisa esto en touchend para decidir si el toque fue
  // un "swipe" (cambiar de foto) o si ya lo manejamos aquí (pinch/pan).
  let mode: Mode = 'none'

  let pinchStartDistance = 0
  let pinchStartScale = 1
  let pinchStartX = 0
  let pinchStartY = 0
  let pinchStartMidX = 0
  let pinchStartMidY = 0

  let panStartTouchX = 0
  let panStartTouchY = 0
  let panStartX = 0
  let panStartY = 0

  let swipeStartX = 0
  let lastTapAt = 0
  let lastTapX = 0
  let lastTapY = 0

  function reset() {
    state.scale = 1
    state.x = 0
    state.y = 0
    mode = 'none'
  }

  function isZoomed() {
    return state.scale > SNAP_BACK_THRESHOLD
  }

  function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
  }

  // Evita que puedas arrastrar la foto kilómetros fuera de la pantalla.
  // No es un cálculo pixel-perfecto del tamaño real de la imagen, pero da
  // un límite razonable que crece junto con el zoom.
  function clampPan(scale: number, x: number, y: number) {
    const maxOffset = (scale - 1) * 260
    return {
      x: clamp(x, -maxOffset, maxOffset),
      y: clamp(y, -maxOffset, maxOffset),
    }
  }

  function touchDistance(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  function touchMidpoint(touches: TouchList) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      mode = 'pinch'
      pinchStartDistance = touchDistance(e.touches) || 1
      pinchStartScale = state.scale
      pinchStartX = state.x
      pinchStartY = state.y
      const mid = touchMidpoint(e.touches)
      pinchStartMidX = mid.x
      pinchStartMidY = mid.y
      return
    }

    if (e.touches.length !== 1) return
    const t = e.touches[0]

    // Doble toque: alterna entre tamaño normal y acercado.
    const now = Date.now()
    const sameSpot =
      Math.abs(t.clientX - lastTapX) < DOUBLE_TAP_RADIUS_PX &&
      Math.abs(t.clientY - lastTapY) < DOUBLE_TAP_RADIUS_PX
    if (now - lastTapAt < DOUBLE_TAP_MS && sameSpot) {
      lastTapAt = 0
      if (isZoomed()) {
        reset()
      } else {
        state.scale = DOUBLE_TAP_ZOOM
        state.x = 0
        state.y = 0
      }
      mode = 'none'
      return
    }
    lastTapAt = now
    lastTapX = t.clientX
    lastTapY = t.clientY

    if (isZoomed()) {
      mode = 'pan'
      panStartTouchX = t.clientX
      panStartTouchY = t.clientY
      panStartX = state.x
      panStartY = state.y
    } else {
      mode = 'swipe'
      swipeStartX = t.clientX
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (mode === 'pinch' && e.touches.length === 2) {
      // Clave para arreglar el bug: al bloquear el gesto aquí, el
      // navegador nunca se entera de que hubo un pellizco, así que nunca
      // hace zoom de la página completa.
      e.preventDefault()
      const dist = touchDistance(e.touches)
      const factor = dist / pinchStartDistance
      const mid = touchMidpoint(e.touches)
      const nextScale = clamp(pinchStartScale * factor, MIN_SCALE, MAX_SCALE)
      const dragged = clampPan(
        nextScale,
        pinchStartX + (mid.x - pinchStartMidX),
        pinchStartY + (mid.y - pinchStartMidY)
      )
      state.scale = nextScale
      state.x = nextScale <= SNAP_BACK_THRESHOLD ? 0 : dragged.x
      state.y = nextScale <= SNAP_BACK_THRESHOLD ? 0 : dragged.y
      return
    }

    if (mode === 'pan' && e.touches.length === 1) {
      e.preventDefault()
      const t = e.touches[0]
      const dragged = clampPan(
        state.scale,
        panStartX + (t.clientX - panStartTouchX),
        panStartY + (t.clientY - panStartTouchY)
      )
      state.x = dragged.x
      state.y = dragged.y
    }
    // modo 'swipe': no bloqueamos nada aquí, el componente decide en
    // touchend si fue un deslizón para cambiar de foto.
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 1 && mode === 'pinch') {
      // Soltó un dedo pero queda otro puesto: seguimos con el que queda,
      // ya sea para pan (si sigue en zoom) o para un swipe normal.
      const t = e.touches[0]
      if (isZoomed()) {
        mode = 'pan'
        panStartTouchX = t.clientX
        panStartTouchY = t.clientY
        panStartX = state.x
        panStartY = state.y
      } else {
        mode = 'swipe'
        swipeStartX = t.clientX
      }
      return
    }

    if (e.touches.length === 0) {
      if (!isZoomed()) {
        state.x = 0
        state.y = 0
        state.scale = 1
      }
      mode = 'none'
    }
  }

  return {
    state,
    reset,
    isZoomed,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    // El componente los necesita para decidir el swipe (cambiar de foto)
    // en su propio touchend.
    getMode: () => mode,
    getSwipeStartX: () => swipeStartX,
  }
}