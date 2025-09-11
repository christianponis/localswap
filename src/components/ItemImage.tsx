'use client'

import { useState } from 'react'
import { Image as ImageIcon, Camera } from 'lucide-react'

interface ItemImageProps {
  images?: string[]
  title: string
  className?: string
}

export function ItemImage({ images, title, className = '' }: ItemImageProps) {
  const [imageError, setImageError] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  
  // Se non ci sono immagini, mostra placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`item-image-placeholder ${className}`}>
        <Camera size={24} />
        <span className="placeholder-text">Nessuna foto</span>
      </div>
    )
  }

  // Se c'è un errore di caricamento, mostra fallback
  if (imageError) {
    return (
      <div className={`item-image-placeholder ${className}`}>
        <ImageIcon size={24} />
        <span className="placeholder-text">Immagine non disponibile</span>
      </div>
    )
  }

  return (
    <div className={`item-image-container ${className}`}>
      <img
        src={images[currentImage]}
        alt={title}
        className="item-image"
        onError={() => setImageError(true)}
        loading="lazy"
      />
      
      {/* Indicatore multiple immagini */}
      {images.length > 1 && (
        <div className="image-counter-badge">
          <ImageIcon size={12} />
          <span>{images.length}</span>
        </div>
      )}
      
      {/* Navigazione se multiple immagini */}
      {images.length > 1 && (
        <div className="image-navigation">
          {images.map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${index === currentImage ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImage(index)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}