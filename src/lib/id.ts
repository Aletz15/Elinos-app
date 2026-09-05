// 🆔 Genera un id único para cada línea del carrito. Algunos navegadores de
// celular (sobre todo el navegador interno de apps como WhatsApp/Instagram,
// o versiones viejas de Safari/Android) NO tienen crypto.randomUUID().
// Esta función usa crypto.randomUUID() si está disponible y, si no, genera
// un id igual de único a mano — así el botón funciona en cualquier celular.
// 👉 Vive aquí (y no repetida en cada vista) porque tanto CatalogView.vue
// como PackagesView.vue necesitan generar ids de carrito.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // sigue abajo al método alterno
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}