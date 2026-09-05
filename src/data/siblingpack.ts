// 👉 "Pack para Hermanos": promo especial para 2 niños en un mismo pedido,
// cada uno con su propio personaje y nombre — tamaño, letra y precio
// vienen FIJOS (no se calculan como el resto del catálogo). Si el jefe de
// Elinos cambia el precio o el tamaño de esta promo, solo edita aquí.
export const SIBLING_PACK_PRICE = 170
export const SIBLING_PACK_LABELS_PER_CHILD = 40
export const SIBLING_PACK_TOTAL_LABELS = SIBLING_PACK_LABELS_PER_CHILD * 2

export const SIBLING_PACK_SIZE_ID = '3x2'
export const SIBLING_PACK_SIZE_LABEL = '3 x 2 cm'

// Única letra disponible para este pack (ver /mnt/user-data/uploads/catalog.ts → fonts).
export const SIBLING_PACK_FONT_ID = 'pizzatime'
export const SIBLING_PACK_FONT_LABEL = 'Pizza Time'

// El anuncio no menciona forma, así que se deja fija en rectangular normal
// (no la de esquinas redondeadas). Si Elinos quiere que también se pueda
// elegir la forma, avisa y se agrega ese selector.
export const SIBLING_PACK_SHAPE_ID = 'rectangular'
export const SIBLING_PACK_SHAPE_LABEL = 'Rectangular'