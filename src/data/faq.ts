
export interface FaqItem {
  question: string
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    question: '¿Cuánto cuesta?',
    answer:
      'Cada paquete cuesta $150, sin importar el tamaño que elijas.\n' +
      'Lo que cambia según el tamaño es la cantidad de etiquetas que trae el paquete:\n' + 
      '3x2cm (85 piezas), 4x1.5cm (75 piezas) o 5x2cm (45 piezas).',
  },
  {
    question: '¿Cuánto tardan en estar listas?',
    answer:
      'De 1 a 3 días habiles.',
  },
  {
    question: '¿Dónde recojo o cómo me las entregan?',
    answer: 'Entrega/recolección en Calle 30A #142 (por 25 y 25A), Col. Chuburná de Hidalgo, 97206 Mérida, Yuc. — casa color azul turquesa.\n'+
     '<strong>Más abajo puedes ver el mapa exacto.</strong>',
  },
  {
    question: '¿De qué material son y aguantan lavadora?',
    answer: 'Material termoadherible, resiste la lavadora y secadora.',
  },
  {
    question: '¿Puedo pedir menos piezas de las que trae el paquete?',
    answer: 'Por ahora solo vendemos por paquete completo del tamaño que elijas — es la única forma en la que trabajamos.',
  },
  {
    question: '¿Cómo pago?',
    answer: 'Por transferencia bancaria. <strong>Te compartimos los datos y el código de tu pedido justo después de enviar tu solicitud.</strong>',
  },
]