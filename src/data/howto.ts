// 👉 Instrucciones reales de cómo aplicar la etiqueta planchable.
export interface HowToStep {
  title: string
  description: string
}

export const howToSteps: HowToStep[] = [
  { title: 'Ajusta la plancha', description: 'Temperatura #4 (algodón).' },
  { title: 'Plancha la zona primero', description: 'Plancha ligeramente donde irá la etiqueta para quitar arrugas.' },
  { title: 'Coloca la etiqueta', description: 'Con la cara impresa hacia arriba, sobre la prenda.' },
  { title: 'Presiona la plancha', description: 'Sobre la etiqueta durante 12-15 segundos, haciendo presión.' },
  { title: 'Deja enfriar', description: 'No despegues el film hasta que la etiqueta esté completamente fría.' },
  {
    title: 'Acabado extra (opcional)',
    description: 'Para un acabado más suave y resistente al lavado, coloca papel albanene sobre la etiqueta y plancha 5 segundos adicionales.',
  },
]

// 👉 Si quieres mostrar tu video tutorial de TikTok directo en la página:
// 1. Copia tu archivo de video a public/videos/ (ej. public/videos/tutorial.mp4)
// 2. Pon esa ruta aquí abajo, ej: '/videos/tutorial.mp4'
// Déjalo vacío ('') si no quieres mostrar video, solo el texto de los pasos.
export const TUTORIAL_VIDEO = '/tutorial.mp4' // ej: '/videos/tutorial.mp4'
