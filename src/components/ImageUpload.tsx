'use client'

import { useState, useRef } from 'react'
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
}

export function ImageUpload({ 
  onImagesChange, 
  maxImages = 3, 
  existingImages = [] 
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, uploading, uploadProgress } = useImageUpload()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const url = await uploadImage(file)
        if (url) {
          const newImages = [...images, url]
          setImages(newImages)
          onImagesChange(newImages)
        }
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="image-upload-container">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`image-upload-area ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          {uploading ? (
            <div className="upload-progress">
              <div className="upload-spinner">
                <Upload className="animate-bounce" size={24} />
              </div>
              <p className="upload-text">Caricamento... {uploadProgress}%</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">
                <Camera size={32} />
              </div>
              <p className="upload-title">Aggiungi foto</p>
              <p className="upload-hint">
                Clicca o trascina fino a {maxImages} immagini
              </p>
              <p className="upload-specs">JPG, PNG • Max 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((url, index) => (
            <div key={index} className="image-preview-item">
              <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="remove-image-btn"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 0 && (
        <div className="image-counter">
          <ImageIcon size={16} />
          <span>{images.length}/{maxImages} foto</span>
        </div>
      )}
    </div>
  )
}