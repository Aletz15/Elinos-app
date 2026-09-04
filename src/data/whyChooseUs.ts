// 👉 Textos de la sección "¿Por qué elegir Elinos?". Para editar el
// mensaje o los puntos, solo cambia lo de aquí abajo.
export interface WhyChooseItem {
  emoji: string
  title: string
  description: string
}

export const whyChooseIntro =
  'A diferencia de las entregas masivas y apresuradas donde los diseños descuidan las proporciones y las letras, en Elinos cuidamos cada detalle para ti:'

export const whyChooseItems: WhyChooseItem[] = [
  {
    emoji: '✨',
    title: 'Tipografías y nombres equilibrados',
    description: 'Diseños armoniosos y atractivos, sin letras deformes.',
  },
  {
    emoji: '✂️',
    title: 'Elaboración 100% artesanal',
    description: 'Recortamos y preparamos cada etiqueta con dedicación para que luzcan hermosas.',
  },
  {
    emoji: '🛍️',
    title: 'Empaque impecable',
    description: 'Te las entregamos ordenadas y listas en su propia bolsita.',
  },
]