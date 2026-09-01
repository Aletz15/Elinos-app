// 👉 Edita este archivo si cambia tu política o tus datos bancarios.

export const paymentPolicy = `Para poder iniciar el trabajo es necesario cubrir el pago total, ya que en ocasiones anteriores hemos tenido trabajos realizados que no fueron recogidos. Agradecemos mucho tu comprensión, esto nos ayuda a mantener el orden y asegurar una mejor atención para todos nuestros clientes 💜`

export interface BankAccount {
  bank: string
  holder: string
  clabe: string
  card?: string
}

export const bankAccount: BankAccount = {
  bank: 'Mercado Pago W',
  holder: 'Eli Efrain Gomez Alcocer',
  clabe: '7229 6902 8368 9625 79',
  card: '', // opcional, tarjeta para depósito
}

// Si también aceptas Mercado Pago, PayPal, etc., agrega el link aquí (o deja vacío).
export const alternativePaymentLink = ''