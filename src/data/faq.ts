
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
      '3x2cm (85 piezas),\n' +
      '4x1.5cm (65 piezas),\n'+
      '5x2cm (45 piezas).'
  },
  {
    question: '¿Cuánto tardan en estar listas?',
    answer:
    'De 1 a 3 días habiles.\n'+
    '"Porque lo hecho a mano con amor y paciencia siempre vale la pena esperar."'
  },
  {
    question: '¿Dónde recojo o cómo me las entregan?',
    answer: '<strong>Recolección personal:</strong>\n'+
    'Pasa por tu pedido en Calle 30A #142 (por 25 y 25A), Col. Chuburná de Hidalgo, 97206 Mérida, Yuc. — casa color azul turquesa.\n'+
    '📍Más abajo puedes ver el mapa exacto.\n'+
    '<strong>Envío a domicilio:</strong>\n' +
    'Una vez avisado que están listas, tú solicitas el servicio (DiDi, Uber, Rappi) y nosotros le entregamos el paquete al repartidor',
  },
  {
    question: '¿De qué material son y aguantan lavadora?',
    answer: 'Material termoadherible, resiste la lavadora y secadora.',
  },
  {
    question: '¿Cómo pago?',
    answer: 'Por transferencia bancaria. <strong>Te compartimos los datos y el código de tu pedido justo después de enviar tu solicitud.</strong>',
  },
]