import type { Order } from '../types'

// Link de contacto general al WhatsApp del taller (botón flotante, footer, etc.)
// — no lleva datos de ningún pedido, solo abre el chat con un saludo.
export function buildContactWhatsappLink(): string {
  const sellerNumber = import.meta.env.VITE_SELLER_WHATSAPP as string | undefined
  const text = encodeURIComponent('Hola 😊, tengo una pregunta sobre las etiquetas🏷️')

  if (!sellerNumber) {
    return `https://wa.me/?text=${text}`
  }
  return `https://wa.me/${sellerNumber}?text=${text}`
}

// Versión "limpia" del link, sin el texto precargado — se usa como href
// visible (lo que se ve al pasar el mouse encima), mientras que al hacer
// clic sí se abre la versión de arriba con el mensaje completo.
export function buildContactWhatsappCleanLink(): string {
  const sellerNumber = import.meta.env.VITE_SELLER_WHATSAPP as string | undefined
  if (!sellerNumber) {
    return 'https://wa.me/'
  }
  return `https://wa.me/${sellerNumber}`
}

// Código corto y legible para identificar un pedido a simple vista (ej. #A3F2).
// Se deriva del id del pedido, así que es el mismo siempre para el mismo pedido.
export function orderCode(order: Order): string {
  if (!order.id) return '----'
  return '#' + order.id.replace(/-/g, '').slice(0, 4).toUpperCase()
}

// Un solo mensaje con TODO: cada etiqueta del carrito, el total y aviso de que el
// comprobante viene adjunto. El cliente solo tiene que adjuntar la foto
// del comprobante en el mismo chat después de que se abra.
// Nota: se evitan emoji fuera del rango básico de Unicode (como paw/corazón/dedo)
// porque WhatsApp a veces los corrompe cuando llegan por un link wa.me generado
// por código; se usan símbolos simples (->, *, etc.) que sí son estables.
export function buildOrderWhatsappLink(order: Order): string {
  const sellerNumber = import.meta.env.VITE_SELLER_WHATSAPP as string | undefined
  const code = orderCode(order)

  const itemLines = (order.items ?? []).map((item, i) => {
    return (
      `Etiqueta ${i + 1}: ${item.character_name} - "${item.name_to_print}" - ` +
      `Letra ${item.font_label} - ${item.shape_label} - ${item.size_label} - ${item.packages} paquete(s) (${item.quantity} etiquetas) - $${item.line_total}`
    )
  })

  const lines = [
    '¡Hola Elinos! 💜, quiero confirmar mi pedido y adjunto mi comprobante de pago.',
    '',
    '',
    `Codigo de pedido: ${code}`,
    '',
    '',
    ...itemLines,
    '',
    '',
    `Total pagado: $${order.total}✅`,
    order.note ? `Nota: ${order.note}` : null,
    '',
    '',
    `Mi nombre: ${order.customer_name}`,
    '',
    '(Adjunto el comprobante de mi transferencia aqui abajo)',
  ].filter(Boolean)

  const text = encodeURIComponent(lines.join('\n'))

  if (!sellerNumber) {
    return `https://wa.me/?text=${text}`
  }
  return `https://wa.me/${sellerNumber}?text=${text}`
}