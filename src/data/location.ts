// 👉 Dirección y coordenadas del taller / punto de entrega.
// Las coordenadas son las que importan para que el mapa apunte al lugar
// correcto — el texto de dirección es solo lo que se muestra al cliente.
// Si te mudas, suelta un pin nuevo en Google Maps (clic derecho > "¿Qué hay
// aquí?") y reemplaza lat/lng con esos números.
export const businessAddress = 'Calle 30A #142 (por 25 y 25A), Col. Chuburná de Hidalgo, 97206 Mérida, Yuc.'
export const businessLandmark = '📍 Casa color azul turquesa'

const businessLat = 21.009480
const businessLng = -89.643544

// Mapa embebido de Google Maps centrado en las coordenadas exactas (no necesita API key).
export const googleMapsEmbedSrc = `https://www.google.com/maps?q=${businessLat},${businessLng}&z=18&output=embed`

// Link que abre la ubicación exacta directo en la app/web de Google Maps.
export const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${businessLat},${businessLng}`