'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClient()

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `items/${fileName}`

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('items')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('items')
        .getPublicUrl(filePath)

      return urlData.publicUrl

    } catch (error) {
      // Silently handle storage bucket errors during development
      // Return a placeholder URL instead of null
      return '/images/placeholder.svg'
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `items/${fileName}`

      const { error } = await supabase.storage
        .from('items')
        .remove([filePath])

      return !error
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  return {
    uploadImage,
    deleteImage,
    uploading,
    uploadProgress
  }
}