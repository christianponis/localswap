export const APP_CONFIG = {
  MAX_RADIUS_METERS: Number(process.env.NEXT_PUBLIC_MAX_RADIUS_METERS) || 500,
  DEFAULT_LOCATION: {
    lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LOCATION_LAT) || 45.4642,
    lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LOCATION_LNG) || 9.1900,
  },
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

// Categorie per OGGETTI
export const OBJECT_CATEGORIES = [
  { value: 'casa', label: '🏠 Casa', emoji: '🏠' },
  { value: 'libri', label: '📚 Libri', emoji: '📚' },
  { value: 'elettronica', label: '🔌 Elettronica', emoji: '🔌' },
  { value: 'vestiti', label: '👕 Vestiti', emoji: '👕' },
  { value: 'sport', label: '⚽ Sport', emoji: '⚽' },
  { value: 'giochi', label: '🎮 Giochi', emoji: '🎮' },
  { value: 'altro_oggetto', label: '🔧 Altro', emoji: '🔧' },
] as const

// Categorie per SERVIZI
export const SERVICE_CATEGORIES = [
  { value: 'casa_servizi', label: '🔨 Lavori Casa', emoji: '🔨' },
  { value: 'giardinaggio', label: '🌱 Giardinaggio', emoji: '🌱' },
  { value: 'ripetizioni', label: '📖 Ripetizioni', emoji: '📖' },
  { value: 'trasporti', label: '🚗 Trasporti', emoji: '🚗' },
  { value: 'pulizie', label: '🧹 Pulizie', emoji: '🧹' },
  { value: 'pet_care', label: '🐕 Pet Care', emoji: '🐕' },
  { value: 'tech_support', label: '💻 Supporto Tech', emoji: '💻' },
  { value: 'altro_servizio', label: '🛠️ Altro', emoji: '🛠️' },
] as const

// Compatibilità - mantiene le vecchie categorie per non rompere il codice esistente
export const CATEGORIES = OBJECT_CATEGORIES

// Tipo di inserzione: oggetto o servizio
export const ITEM_KINDS = [
  { value: 'object', label: 'Oggetto', emoji: '📦', description: 'Oggetti fisici da vendere, prestare o scambiare' },
  { value: 'service', label: 'Servizio', emoji: '🛠️', description: 'Servizi che offri nel tuo vicinato' },
] as const

// Tipi per OGGETTI
export const OBJECT_TYPES = [
  { value: 'vendo', label: 'Vendo', emoji: '💰', color: 'green' },
  { value: 'scambio', label: 'Scambio', emoji: '🔄', color: 'orange' },
  { value: 'presto', label: 'Presto', emoji: '🤝', color: 'blue' },
] as const

// Tipi per SERVIZI
export const SERVICE_TYPES = [
  { value: 'offro', label: 'Offro', emoji: '✨', color: 'purple' },
  { value: 'cerco', label: 'Cerco', emoji: '🔍', color: 'red' },
] as const

// Compatibilità - mantiene i vecchi tipi per non rompere il codice esistente
export const ITEM_TYPES = OBJECT_TYPES

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

// Utility functions per ottenere categorie e tipi in base al kind
export function getCategoriesForKind(kind: 'object' | 'service') {
  return kind === 'object' ? OBJECT_CATEGORIES : SERVICE_CATEGORIES
}

export function getTypesForKind(kind: 'object' | 'service') {
  return kind === 'object' ? OBJECT_TYPES : SERVICE_TYPES
}

export function getAllCategories() {
  return [...OBJECT_CATEGORIES, ...SERVICE_CATEGORIES]
}

export function getAllTypes() {
  return [...OBJECT_TYPES, ...SERVICE_TYPES]
}