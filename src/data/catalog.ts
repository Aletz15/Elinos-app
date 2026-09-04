import type { Character, ShapeOption, SizeOption, FontOption } from '../types'

// 👉 Para agregar/quitar diseños disponibles, edita solo este arreglo.
// El precio ya NO depende del diseño elegido (todo se cobra por paquete, ver "sizes" abajo).
export const characters: Character[] = [
  { id: 'Stitch', name: 'Stitch', emoji: '🐕', color: '#cddff3', image: '/characters/stitch.png' },
  { id: 'Hello Kitty', name: 'Hello Kitty', emoji: '🐈', color: '#f59ced', image: '/characters/hellokitty.png' },
  { id: 'Anna', name: 'Anna', emoji: '👑', color: '#FED7AA', image: '/characters/ana.png' },
  { id: 'Pikachu', name: 'Pikachu', emoji: '😼', color: '#f1eaaa', image: '/characters/pikachu.png' },
  { id: 'Sonic', name: 'Sonic', emoji: '⚡', color: '#DBEAFE', image: '/characters/sonic.png' },
  { id: 'Otro Personaje', name: 'Otro Personaje', emoji: '✏️', color: '#E5E7EB' },
]


export const shapes: ShapeOption[] = [
  { id: 'rectangular', label: 'Rectangular' },
  { id: 'rectangular-redondeado', label: 'Rectangular (esquinas redondeadas)' },
]

export const sizes: SizeOption[] = [
  { id: '3x2', label: '3 x 2 cm', piecesPerPackage: 85, widthCm: 3, heightCm: 2, images: ['/sizes/3x2/example2.jpeg'], compareImage: '/sizes/compare/3x2.jpeg' },
  { id: '4x1.5', label: '4 x 1.5 cm', piecesPerPackage: 65, widthCm: 4, heightCm: 1.5, images: ['/sizes/4x1/example3.jpeg'], compareImage: '/sizes/compare/4x1.5.jpeg' },
  { id: '5x2', label: '5 x 2 cm', piecesPerPackage: 45, widthCm: 5, heightCm: 2, images: ['/sizes/5x2/example2.jpeg'], compareImage: '/sizes/compare/5x2.jpeg' },
]

export const fonts: FontOption[] = [
  { id: 'letsplay', label: 'LetsPlay', fontFamily: 'LetsPlay', image: '/fontsimage/letsplay.jpeg' },
  { id: 'pizzatime', label: 'Pizza Time', fontFamily: 'PizzaTime', image: '/fontsimage/pizzatime.jpeg' },
  { id: 'kgmissterward', label: 'KG Miss Sterward', fontFamily: 'KGMissSterward', image: '/fontsimage/kgmisssterward.jpeg' },
]

// Precio fijo por paquete completo, sin importar el tamaño elegido.
export const PACKAGE_PRICE = 150