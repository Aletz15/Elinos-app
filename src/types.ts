export interface Character {
  id: string
  name: string
  emoji: string
  color: string
  image?: string // opcional: ruta a una imagen real en /public, ej. '/characters/stitch.png'
}

export interface ShapeOption {
  id: string
  label: string
}

export interface SizeOption {
  id: string
  label: string
  piecesPerPackage: number
  widthCm: number // ancho real en cm, para que la vista previa use la misma proporción
  heightCm: number // alto real en cm, para que la vista previa use la misma proporción
  images?: string[] // opcionales: varias fotos de ejemplo de esa medida, ej. ['/sizes/3x2-1.png', '/sizes/3x2-2.png']
  compareImage?: string // opcional: foto de ejemplo para comparar tamaños, ej. '/sizes/compare/3x2.png'
}

export interface FontOption {
  id: string
  label: string
  fontFamily: string // nombre CSS de la fuente (debe coincidir con un @font-face en style.css)
  image?: string // opcional: foto de ejemplo con esa letra, ej. '/fonts/letsplay.png'
}

// Una línea del carrito: un diseño/nombre/tamaño/forma con su cantidad de paquetes.
// El id es solo del lado del cliente (para poder listarla/quitarla antes de enviar).
export interface CartItem {
  id: string
  character_id: string
  character_name: string
  name_to_print: string
  font_id: string
  font_label: string
  size_id: string
  size_label: string
  shape_id: string
  shape_label: string
  packages: number
  quantity: number
  line_total: number
  // 👉 "Pack para Hermanos": cuando is_sibling_pack es true, este ítem
  // representa a DOS niños en un solo paquete (precio y tamaño fijos, ver
  // ../data/siblingPack.ts). Los campos de arriba (character_id,
  // character_name, name_to_print) son del PRIMER niño; estos de abajo son
  // del segundo. Los demás campos (font_id, size_id, shape_id, packages,
  // quantity, line_total) se llenan igual que en un ítem normal.
  is_sibling_pack?: boolean
  second_character_id?: string
  second_character_name?: string
  second_name_to_print?: string
}

export type OrderStatus = 'pendiente_pago' | 'nuevo' | 'en_produccion' | 'enviada'

export interface Order {
  id?: string
  created_at?: string
  items: CartItem[]
  total: number
  customer_name: string
  customer_whatsapp: string
  note: string | null
  wants_preview: boolean
  status: OrderStatus
  reference_images?: string[] | null // rutas en Supabase Storage (bucket "referencias-pedido"), no las imágenes en sí
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_pago: 'Pendiente de pago',
  nuevo: 'Nuevo',
  en_produccion: 'En producción',
  enviada: 'Enviada',
}