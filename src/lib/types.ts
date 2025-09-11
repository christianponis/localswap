export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  phone?: string
  location?: {
    lat: number
    lng: number
  }
  reputation_score: number
  verified_phone: boolean
  verified_email: boolean
  verified_id: boolean
  total_transactions: number
  successful_transactions: number
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
  title: string
  description?: string
  category: 'casa' | 'libri' | 'elettronica' | 'vestiti' | 'altro'
  type: 'vendo' | 'scambio' | 'presto'
  price?: number
  currency: string
  location: {
    lat: number
    lng: number
  }
  address_hint?: string
  image_urls?: string[]
  status: 'active' | 'reserved' | 'completed' | 'expired'
  expires_at?: string
  views_count: number
  created_at: string
  updated_at: string
  distance_meters?: number
  profile?: Profile
}

export interface Chat {
  id: string
  item_id: string
  buyer_id: string
  seller_id: string
  status: 'active' | 'closed'
  last_message_at: string
  created_at: string
  item?: Item
  buyer?: Profile
  seller?: Profile
  last_message?: Message
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'system'
  read_at?: string
  created_at: string
  sender?: Profile
}

export interface UserRating {
  id: string
  rated_user_id: string
  rater_user_id: string
  rating: number
  comment?: string
  transaction_type: 'vendo' | 'scambio' | 'presto'
  item_id?: string
  created_at: string
  rater?: Profile
}

export interface Location {
  lat: number
  lng: number
  accuracy?: number
}

export interface CreateItemData {
  title: string
  description?: string
  category: Item['category']
  type: Item['type']
  price?: number
  location: Location
  address_hint?: string
  image_urls?: string[]
  expires_at?: string
}