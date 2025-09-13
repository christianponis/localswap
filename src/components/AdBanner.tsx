'use client'

import React, { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

interface AdBannerProps {
  position: 'top' | 'middle' | 'bottom'
  type: 'banner' | 'square' | 'native'
  className?: string
}

// Mock ads data for demo - in production this would come from an ad network
const mockAds = {
  banner: [
    {
      id: '1',
      title: 'Risparmia fino al 50%',
      description: 'Trova le migliori offerte nella tua zona',
      image: '/images/placeholder.svg',
      url: '#',
      company: 'Local Deals'
    },
    {
      id: '2',
      title: 'Servizi di casa a domicilio',
      description: 'Idraulico, elettricista, pulizie',
      image: '/images/placeholder.svg',
      url: '#',
      company: 'HomeFix'
    }
  ],
  square: [
    {
      id: '3',
      title: 'App per delivery',
      description: 'Ordina e ricevi in 30 minuti',
      image: '/images/placeholder.svg',
      url: '#',
      company: 'FastDelivery'
    }
  ],
  native: [
    {
      id: '4',
      title: 'Bicicletta elettrica usata',
      description: 'Ottimo stato, batteria nuova. Perfetta per la città.',
      price: '€890',
      distance: '200m',
      image: '/images/placeholder.svg',
      url: '#',
      sponsored: true
    }
  ]
}

export const AdBanner: React.FC<AdBannerProps> = ({
  position,
  type,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  if (!isVisible) return null

  const ads = mockAds[type]
  const currentAd = ads[currentAdIndex % ads.length]

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleAdClick = () => {
    // In production, this would track clicks and redirect
    console.log('Ad clicked:', currentAd.id)
  }

  if (type === 'native') {
    return (
      <div className={`ad-native ${className}`}>
        <div className="ad-sponsored-label">Sponsorizzato</div>
        <div className="ad-native-content" onClick={handleAdClick}>
          <div className="ad-native-image">
            <img src={currentAd.image} alt={currentAd.title} />
          </div>
          <div className="ad-native-info">
            <h3 className="ad-native-title">{currentAd.title}</h3>
            <p className="ad-native-description">{currentAd.description}</p>
            <div className="ad-native-footer">
              <span className="ad-native-price">{currentAd.price}</span>
              <span className="ad-native-distance">{currentAd.distance}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-banner ad-banner-${type} ad-position-${position} ${className}`}>
      <button
        className="ad-close-btn"
        onClick={handleClose}
        aria-label="Chiudi pubblicità"
      >
        <X size={16} />
      </button>

      <div className="ad-content" onClick={handleAdClick}>
        {type === 'banner' ? (
          <div className="ad-banner-layout">
            <div className="ad-image">
              <img src={currentAd.image} alt={currentAd.title} />
            </div>
            <div className="ad-text">
              <h3 className="ad-title">{currentAd.title}</h3>
              <p className="ad-description">{currentAd.description}</p>
              <div className="ad-company">{currentAd.company}</div>
            </div>
            <div className="ad-cta">
              <ExternalLink size={16} />
            </div>
          </div>
        ) : (
          <div className="ad-square-layout">
            <img src={currentAd.image} alt={currentAd.title} />
            <div className="ad-square-overlay">
              <h3 className="ad-title">{currentAd.title}</h3>
              <p className="ad-description">{currentAd.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className="ad-label">Pubblicità</div>
    </div>
  )
}