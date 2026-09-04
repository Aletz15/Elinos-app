import { ref } from 'vue'
import { supabase } from './supabase'
import type { Order, OrderStatus } from '../types'

// 📦 Estado del panel de pedidos, compartido: antes vivía dentro de
// OrderPanel.vue, así que cada vez que salías de /panel y volvías, el
// componente se destruía y se volvía a montar desde cero (por eso el
// "parpadeo" de Cargando pedidos…). Al vivir aquí, fuera del componente
// (igual que ya hace cart.ts), los pedidos se quedan en memoria mientras
// no recargues la página entera — solo se piden a Supabase la primera vez.
export const orders = ref<Order[]>([])
export const ordersLoading = ref(true)
export const ordersLoadError = ref('')
export const ordersLoadedOnce = ref(false)

// 🔔 Aviso de pedido nuevo: cuando llega un pedido mientras tienes el panel
// abierto, aquí se guarda su nombre/código para que OrderPanel.vue muestre
// una notita arriba. Se pone en null solo/a si nadie más llegó (si llegan
// varios seguidos, siempre queda el más reciente).
export const newOrderAlert = ref<{ id: string; customer_name: string } | null>(null)

// 👉 Mensaje de bienvenida fijo (debajo del título "Panel de pedidos"):
// vive aquí, fuera del componente OrderPanel.vue, por la misma razón que
// "orders" vive aquí — OrderPanel.vue se destruye y se vuelve a montar
// cada vez que sales de /panel y regresas, así que si el mensaje viviera
// dentro del componente, se generaría uno nuevo cada vez. Aquí se queda
// en memoria y solo se limpia al cerrar sesión (ver resetOrdersState).
export const welcomeMessage = ref('')

// Para agregar a alguien más, solo añade su correo aquí con sus propias
// frases (se elige una al azar, pero solo una vez por sesión). "{greeting}"
// se reemplaza solo por "Buenos días/tardes/noches" según la hora.
const WELCOME_MESSAGES: Record<string, string[]> = {
  'elinosgm@gmail.com': [
    '¡Hola, Elinos! Todo listo. 🏷️',
    '{greeting}, Elinos ✨ tu panel te espera.',
    'Bienvenida de vuelta, Elinos 💜',
    '{greeting}, Elinos. Aquí están tus pedidos.',
    '¡Ya llegaste! {greeting} 🎉',
  ],
  'alejandrogoga15@gmail.com': [
    '{greeting}, Alejandro 👨‍💻 modo admin activado.',
    'El programador en la casa 🛠️ {greeting}.',
    'Bienvenido de vuelta, Alejandro.',
    '{greeting}, jefe del código 😄',
    'Sesión de admin iniciada. {greeting}, Alejandro.',
  ],
}

function greetingForNow(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// 👉 Solo genera un mensaje nuevo si todavía no hay uno guardado — así,
// aunque esto se llame otra vez al montar el componente (cambiaste de
// página y volviste), el mensaje NO cambia. Vuelve a estar vacío recién
// hasta que cierres sesión (resetOrdersState) y entres de nuevo.
export function ensureWelcomeMessage(email: string | undefined) {
  if (welcomeMessage.value) return
  const greeting = greetingForNow()
  const pool = (email && WELCOME_MESSAGES[email.toLowerCase()]) || [`{greeting}, bienvenido/a 👋`]
  const template = pool[Math.floor(Math.random() * pool.length)]
  welcomeMessage.value = template.replace('{greeting}', greeting)
}

// 👉 Para usar tu propio sonido en vez del "beep" generado: copia tu
// archivo de audio a public/sounds/ (ej. public/sounds/nuevo-pedido.mp3)
// y pon aquí esa misma ruta. Déjalo como cadena vacía ('') para usar el
// beep generado en su lugar.
export const NEW_ORDER_SOUND_URL = '/sounds/nuevo-pedido.mp3'

// Suena una campanita cortita (dos tonos) sin necesitar ningún archivo de
// audio. Se usa como respaldo si NEW_ORDER_SOUND_URL está vacío, o si tu
// archivo personalizado no se pudo reproducir (no existe, el navegador lo
// bloqueó, etc.). Nota general: el navegador solo deja sonar audio
// automático después de que hubo algún clic/interacción en la página —
// como el admin ya hace login y usa las pestañas, esto funciona bien en
// la práctica.
// 🔓 Un solo AudioContext reutilizable para toda la sesión, en vez de crear
// uno nuevo cada vez que suena el beep. Los navegadores bloquean el audio
// programático si el AudioContext nunca se "desbloqueó" con un clic real
// del usuario — por eso existe unlockAudioForNotifications() más abajo,
// que se llama desde el botón de "Entrar" del login (un clic real tuyo).
let audioCtx: AudioContext | null = null
let keepAliveOsc: OscillatorNode | null = null

// 🔓 true solo después de que un clic/tecla/touch REAL en esta carga de
// página logró desbloquear el audio. Si vuelves a /panel con la sesión ya
// guardada (sin pasar por "Entrar"), esto empieza en false — OrderPanel.vue
// usa esta bandera para mostrarte un botón "Activar sonido" hasta que lo
// confirmes, en vez de esperar a que toques algo por casualidad.
export const audioUnlocked = ref(false)

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new AudioCtx()
  }
  return audioCtx
}

// 🫀 "Mantener con vida" el AudioContext: algunos navegadores lo suspenden
// solos después de un rato sin sonido real, para ahorrar batería — y una
// vez suspendido, resumirlo programáticamente vuelve a pedir un clic real,
// que puede no llegar nunca si estás en otra pestaña cuando llega el
// pedido. Un oscilador sonando en volumen inaudible cuenta como "audio
// activo" para el navegador, así que el contexto ya no se vuelve a dormir
// solo mientras esta pestaña siga abierta (aunque no esté enfocada).
function startKeepAlive(ctx: AudioContext) {
  if (keepAliveOsc) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    gain.gain.value = 0.00001
    osc.frequency.value = 20
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    keepAliveOsc = osc
  } catch (err) {
    console.error('[audio] no se pudo iniciar el keep-alive', err)
  }
}

// 👉 Llama esta función desde un manejador de clic/tecla/touch REAL (botón
// "Entrar", botón "Activar sonido", o cualquier interacción del documento)
// para que el navegador permita reproducir audio más tarde, cuando llegue
// un pedido nuevo sin que haya un clic de por medio en ese momento.
export function unlockAudioForNotifications() {
  try {
    const ctx = getAudioContext()
    const afterUnlock = () => {
      audioUnlocked.value = true
      startKeepAlive(ctx)
      console.log('[orders-realtime] audio desbloqueado, estado:', ctx.state)
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(afterUnlock).catch((err) => {
        console.error('[audio] no se pudo desbloquear', err)
      })
    } else {
      afterUnlock()
    }
  } catch (err) {
    console.error('No se pudo desbloquear el audio de notificaciones', err)
  }
}

function playGeneratedBeep() {
  try {
    const ctx = getAudioContext()
    const ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve()
    ready
      .then(() => {
        const now = ctx.currentTime
        ;[
          { start: 0, freq: 880 },
          { start: 0.15, freq: 1175 },
        ].forEach(({ start, freq }) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.0001, now + start)
          gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + start)
          osc.stop(now + start + 0.22)
        })
      })
      .catch((err) => {
        console.error('No se pudo reproducir el aviso de pedido nuevo', err)
      })
  } catch (err) {
    console.error('No se pudo reproducir el aviso de pedido nuevo', err)
  }
}

function playNewOrderSound() {
  if (!NEW_ORDER_SOUND_URL) {
    playGeneratedBeep()
    return
  }
  const audio = new Audio(NEW_ORDER_SOUND_URL)
  audio.play().catch((err) => {
    // 🔍 Antes este error se tragaba en silencio, así que nunca sabíamos
    // si el mp3 no sonaba por bloqueo de autoplay o porque el archivo no
    // existe en /public/sounds/nuevo-pedido.mp3 (404). Ahora queda en la
    // consola para poder diferenciarlo.
    console.error('[audio] no sonó el mp3 personalizado, uso el beep de respaldo:', err)
    playGeneratedBeep()
  })
}

// 🔔 Notificaciones del sistema operativo (la misma tecnología de WhatsApp
// Web): a diferencia del beep, estas solo piden permiso UNA VEZ (no en cada
// sesión), y una vez autorizadas pueden aparecer solas — con su propio
// sonido del sistema — aunque no hayas hecho clic en nada y estés en otra
// pestaña o con el navegador minimizado. Eso sí: la pestaña del panel
// tiene que seguir abierta en algún lado; si la cierras del todo, deja de
// funcionar (igual que WhatsApp Web).

export const notificationPermission = ref<NotificationPermission | 'unsupported'>(
  typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
)

// 👉 Llamar esto desde un botón (ej. "Activar notificaciones" en el panel).
// Tiene que salir de un clic real: los navegadores bloquean el cuadro de
// permiso si se pide en automático al cargar la página.
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    notificationPermission.value = 'unsupported'
    return
  }
  const result = await Notification.requestPermission()
  notificationPermission.value = result
}

function showSystemNotification(customerName: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const notif = new Notification('Nuevo pedido en Elinos 🏷️', {
      body: `Pedido de ${customerName}`,
      icon: '/LogoElinosCircular.jpeg',
      tag: 'nuevo-pedido', // agrupa varias seguidas en una sola, no se amontonan
    })
    // Al hacer clic en la notificación, se enfoca la pestaña del panel.
    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch (err) {
    console.error('No se pudo mostrar la notificación del sistema', err)
  }
}

export async function loadOrders() {
  // Solo mostramos "Cargando pedidos…" la primera vez. Las siguientes veces
  // (p. ej. cuando llega un cambio en tiempo real) se actualiza la lista en
  // silencio, sin volver a tapar la pantalla con el mensaje de carga.
  ordersLoading.value = !ordersLoadedOnce.value
  ordersLoadError.value = ''
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    orders.value = (data ?? []) as Order[]
    ordersLoadedOnce.value = true
  } catch (err) {
    ordersLoadError.value = 'No se pudieron cargar los pedidos. Revisa tu configuración de Supabase (.env).'
    console.error(err)
  } finally {
    ordersLoading.value = false
  }
}

export async function changeOrderStatus(id: string, status: OrderStatus) {
  const target = orders.value.find((o) => o.id === id)
  const previousStatus = target?.status
  if (target) target.status = status // optimista
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) {
    console.error(error)
    if (target && previousStatus) target.status = previousStatus // revertir si falló
  }
}

export async function deleteOrderById(id: string) {
  const previous = orders.value
  orders.value = orders.value.filter((o) => o.id !== id) // optimista
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) {
    console.error(error)
    orders.value = previous // revertir si falló
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null

export function startOrdersRealtime() {
  if (channel) return // ya está escuchando, no duplicar
  channel = supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      // 🔍 Log temporal: confirma si el evento de pedido nuevo realmente
      // está llegando a este navegador/pestaña.
      console.log('[orders-realtime] INSERT recibido:', payload)
      const newOrder = payload.new as Order
      newOrderAlert.value = { id: newOrder.id!, customer_name: newOrder.customer_name }
      playNewOrderSound()
      showSystemNotification(newOrder.customer_name)
      loadOrders()
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
      loadOrders()
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, () => {
      loadOrders()
    })
    .subscribe((status) => {
      // 🔍 Log temporal para diagnosticar por qué a veces no llega el aviso
      // de pedido nuevo. Debería decir "SUBSCRIBED". Si dice "CHANNEL_ERROR",
      // "TIMED_OUT" o "CLOSED", el canal no está realmente escuchando.
      // Se puede quitar este console.log una vez confirmado que funciona bien.
      console.log('[orders-realtime] estado del canal:', status)
    })
}

export function stopOrdersRealtime() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}

// Se limpia todo al cerrar sesión, para que un próximo login no muestre
// por un instante los pedidos de la sesión anterior.
export function resetOrdersState() {
  orders.value = []
  ordersLoadedOnce.value = false
  stopOrdersRealtime()
  referenceImageCache.clear()
  newOrderAlert.value = null
  welcomeMessage.value = '' // 👈 así el próximo login genera un mensaje nuevo
}

// 📎 Caché de las URLs firmadas de las imágenes de referencia (compartida,
// igual que los pedidos): sin esto, cada vez que sales de /panel y vuelves,
// cada tarjeta se destruye y se vuelve a montar, así que volvía a pedirle
// a Supabase una URL firmada nueva para cada imagen, aunque fuera la misma
// de siempre. Las URLs firmadas duran 1 hora, así que solo se vuelven a
// pedir si ya pasó ese tiempo (o si cerraste sesión, ver arriba).
const referenceImageCache = new Map<string, { url: string; expiresAt: number }>()

export function isReferenceImageCached(path: string): boolean {
  const cached = referenceImageCache.get(path)
  return !!cached && cached.expiresAt > Date.now()
}

export async function getSignedReferenceImageUrl(path: string): Promise<string | null> {
  const cached = referenceImageCache.get(path)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }
  const { data, error } = await supabase.storage
    .from('referencias-pedido')
    .createSignedUrl(path, 60 * 60) // vigente 1 hora
  if (error || !data) return null
  // Guardamos como si durara 55 min (no 60), por margen de seguridad.
  referenceImageCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000 })
  return data.signedUrl
}