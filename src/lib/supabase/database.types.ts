export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: unknown | null
          reputation_score: number
          verified_phone: boolean
          verified_email: boolean
          verified_id: boolean
          total_transactions: number
          successful_transactions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: unknown | null
          reputation_score?: number
          verified_phone?: boolean
          verified_email?: boolean
          verified_id?: boolean
          total_transactions?: number
          successful_transactions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: unknown | null
          reputation_score?: number
          verified_phone?: boolean
          verified_email?: boolean
          verified_id?: boolean
          total_transactions?: number
          successful_transactions?: number
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          type: string
          price: number | null
          currency: string
          location: unknown
          address_hint: string | null
          image_urls: string[] | null
          status: string
          expires_at: string | null
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          type: string
          price?: number | null
          currency?: string
          location: unknown
          address_hint?: string | null
          image_urls?: string[] | null
          status?: string
          expires_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          type?: string
          price?: number | null
          currency?: string
          location?: unknown
          address_hint?: string | null
          image_urls?: string[] | null
          status?: string
          expires_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          item_id: string
          buyer_id: string
          seller_id: string
          status: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          buyer_id: string
          seller_id: string
          status?: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          buyer_id?: string
          seller_id?: string
          status?: string
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: string
          read_at?: string | null
          created_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          comment: string | null
          transaction_type: string | null
          item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          comment?: string | null
          transaction_type?: string | null
          item_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          comment?: string | null
          transaction_type?: string | null
          item_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_items: {
        Args: {
          user_lat: number
          user_lng: number
          radius_meters?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          category: string
          type: string
          price: number
          image_urls: string[]
          distance_meters: number
          user_id: string
          username: string
          avatar_url: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}