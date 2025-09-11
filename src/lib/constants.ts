export const APP_CONFIG = {
  MAX_RADIUS_METERS: Number(process.env.NEXT_PUBLIC_MAX_RADIUS_METERS) || 500,
  DEFAULT_LOCATION: {
    lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LOCATION_LAT) || 45.4642,
    lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LOCATION_LNG) || 9.1900,
  },
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

export const CATEGORIES = [
  { value: 'casa', label: '🏠 Casa', emoji: '🏠' },
  { value: 'libri', label: '📚 Libri', emoji: '📚' },
  { value: 'elettronica', label: '🔌 Elettronica', emoji: '🔌' },
  { value: 'vestiti', label: '👕 Vestiti', emoji: '👕' },
  { value: 'altro', label: '🔧 Altro', emoji: '🔧' },
] as const

export const ITEM_TYPES = [
  { value: 'vendo', label: 'Vendo', emoji: '💰', color: 'green' },
  { value: 'scambio', label: 'Scambio', emoji: '🔄', color: 'orange' },
  { value: 'presto', label: 'Presto', emoji: '🤝', color: 'blue' },
] as const

export const ITEM_STATUS = [
  { value: 'active', label: 'Attivo' },
  { value: 'reserved', label: 'Riservato' },
  { value: 'completed', label: 'Completato' },
  { value: 'expired', label: 'Scaduto' },
] as const

export const MESSAGE_TYPES = [
  { value: 'text', label: 'Testo' },
  { value: 'image', label: 'Immagine' },
  { value: 'system', label: 'Sistema' },
] as const

export const CHAT_STATUS = [
  { value: 'active', label: 'Attiva' },
  { value: 'closed', label: 'Chiusa' },
] as const

export const REPUTATION_LEVELS = [
  { min: 0, max: 1, label: 'Nuovo', color: 'gray' },
  { min: 1, max: 3, label: 'Principiante', color: 'blue' },
  { min: 3, max: 4, label: 'Affidabile', color: 'green' },
  { min: 4, max: 4.5, label: 'Esperto', color: 'yellow' },
  { min: 4.5, max: 5, label: 'Top Trader', color: 'purple' },
] as const

export const FREE_POSTS_PER_WEEK = 3
export const PREMIUM_PRICE_MONTHLY = 4.99
export const COMMISSION_RATE = 0.03 // 3%