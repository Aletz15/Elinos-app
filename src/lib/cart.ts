import { computed, ref } from 'vue'
import type { CartItem } from '../types'

// 🛒 Carrito compartido: antes vivía solo dentro de CatalogView.vue, pero
// ahora la barra superior (App.vue) también necesita saber cuántas
// etiquetas hay y poder abrir/cerrar el panel "Tu pedido" desde el ícono
// de arriba. Al vivir aquí en su propio archivo, cualquier componente lo
// puede importar y ambos ven siempre los mismos datos (no hay que pasar
// props ni eventos entre App.vue y CatalogView.vue).

export const cart = ref<CartItem[]>([])
export const cartCount = computed(() => cart.value.length)
export const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.line_total, 0)
)

// Controla si el panel "Tu pedido" está abierto como hoja deslizante en
// celular. Lo puede abrir tanto el ícono del carrito en la barra superior
// como el propio catálogo.
export const mobileCartOpen = ref(false)