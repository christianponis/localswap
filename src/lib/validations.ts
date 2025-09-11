import { z } from 'zod'

export const createItemSchema = z.object({
  title: z.string().min(1, 'Titolo richiesto').max(100, 'Titolo troppo lungo'),
  description: z.string().max(500, 'Descrizione troppo lunga').optional(),
  category: z.enum(['casa', 'libri', 'elettronica', 'vestiti', 'altro']),
  type: z.enum(['vendo', 'scambio', 'presto']),
  price: z.number().min(0).max(10000).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address_hint: z.string().max(100).optional(),
  expires_at: z.string().datetime().optional(),
})

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username troppo corto')
    .max(20, 'Username troppo lungo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo lettere, numeri e underscore')
    .optional(),
  full_name: z.string().max(50, 'Nome troppo lungo').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Numero di telefono non valido')
    .optional(),
})

export const sendMessageSchema = z.object({
  chat_id: z.string().uuid(),
  content: z.string().min(1, 'Messaggio richiesto').max(1000, 'Messaggio troppo lungo'),
  message_type: z.enum(['text', 'image', 'system']).default('text'),
})

export const createRatingSchema = z.object({
  rated_user_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(200).optional(),
  transaction_type: z.enum(['vendo', 'scambio', 'presto']),
  item_id: z.string().uuid().optional(),
})

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateRatingInput = z.infer<typeof createRatingSchema>
export type LocationInput = z.infer<typeof locationSchema>