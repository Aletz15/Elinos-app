export interface IronOnPackage {
  id: string
  label: string
  totalLabels: number
  price: number
}

// 👉 Precios según tu flyer: 85 etiquetas por $150, +85 más por $80.
export const ironOnPackages: IronOnPackage[] = [
  { id: 'pkg85', label: '85 etiquetas', totalLabels: 85, price: 150 },
  { id: 'pkg170', label: '170 etiquetas (85 + 85 extra)', totalLabels: 170, price: 230 },
]

export const ironOnSizeLabel = '3 x 2 cm (tamaño real)'
