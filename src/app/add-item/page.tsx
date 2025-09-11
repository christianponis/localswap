'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Euro, Clock, Tag, FileText, Camera } from 'lucide-react'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import { CATEGORIES, ITEM_TYPES, APP_CONFIG } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { ImageUpload } from '@/components/ImageUpload'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AddItemPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Debug auth status and redirect if not authenticated
  useEffect(() => {
    console.log('Auth status:', { user: user?.id, email: user?.email, profile, authLoading })
    
    // Redirect to login if not authenticated and auth loading is complete
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.push('/auth/login?next=/add-item')
    }
  }, [user, profile, authLoading, router])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    price: '',
    location_lat: 0,
    location_lng: 0,
    location_text: '',
    images: [] as string[]
  })
  
  const [locationStatus, setLocationStatus] = useState('Rilevamento posizione...')
  
  const supabase = createClient()

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude,
            location_text: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          }))
          setLocationStatus('✅ Posizione rilevata')
        },
        (error) => {
          setFormData(prev => ({
            ...prev,
            ...APP_CONFIG.DEFAULT_LOCATION,
            location_text: 'Posizione di demo'
          }))
          setLocationStatus('📍 Usando posizione di demo')
        }
      )
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setMessage('Devi essere autenticato per aggiungere un oggetto')
      return
    }

    if (!formData.title || !formData.description || !formData.category || !formData.type) {
      setMessage('Compila tutti i campi obbligatori')
      return
    }

    if (formData.type === 'vendo' && (!formData.price || parseFloat(formData.price) <= 0)) {
      setMessage('Inserisci un prezzo valido per gli oggetti in vendita')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        price: formData.type === 'vendo' ? parseFloat(formData.price) : null,
        currency: 'EUR',
        location: `SRID=4326;POINT(${formData.location_lng} ${formData.location_lat})`,
        address_hint: formData.location_text,
        images: formData.images,
        user_id: user.id,
        status: 'active'
      }

      const { data, error } = await supabase
        .from('items')
        .insert([itemData])
        .select()

      if (error) {
        console.error('Error inserting item:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('Item data sent:', itemData)
        console.error('User info:', { user: user?.id, email: user?.email })
        
        if (error.message?.includes('row-level security')) {
          setMessage('Devi essere autenticato per aggiungere oggetti. Effettua il login.')
        } else if (error.message?.includes('user_id')) {
          setMessage('Errore di autenticazione. Riprova ad accedere.')
        } else {
          const errorMsg = error.message || 'Problema durante la creazione dell\'oggetto'
          setMessage(`Errore: ${errorMsg}`)
          showError('Errore nella pubblicazione', errorMsg)
        }
      } else {
        setMessage('Oggetto aggiunto con successo!')
        console.log('Item created successfully:', data)
        
        // Show success notification
        showSuccess(
          'Oggetto pubblicato!',
          `"${formData.title}" è ora visibile ai tuoi vicini`,
          { label: 'Visualizza', url: '/' }
        )
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          type: '',
          price: '',
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          location_text: formData.location_text
        })
        
        // Redirect to home after success
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Errore imprevisto. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedType = ITEM_TYPES.find(t => t.value === formData.type)
  const selectedCategory = CATEGORIES.find(c => c.value === formData.category)

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">Verifica autenticazione...</div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">Accesso richiesto</div>
          <p className="empty-description">
            Devi essere autenticato per aggiungere oggetti
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-top">
            <LocalSwapLogo size={32} />
            <Link href="/" className="back-link-header">
              <ArrowLeft size={20} />
            </Link>
          </div>
          
          <div className="location-status">
            <MapPin size={16} />
            <span>{locationStatus}</span>
          </div>
        </div>
      </div>

      <main className="main">
        <div className="page-header">
          <h1 className="page-title">Aggiungi Oggetto</h1>
          <p className="page-subtitle">
            Condividi qualcosa con i tuoi vicini
          </p>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Images */}
          <div className="form-group">
            <label className="form-label">
              <Camera size={16} />
              Foto dell'oggetto
            </label>
            <ImageUpload
              onImagesChange={(urls) => setFormData({...formData, images: urls})}
              maxImages={3}
              existingImages={formData.images}
            />
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              <Tag size={16} />
              Titolo *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="es. Trapano elettrico Bosch"
              className="form-input"
              maxLength={100}
              required
            />
            <div className="char-count">{formData.title.length}/100</div>
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={16} />
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="form-select"
              required
            >
              <option value="">Seleziona tipo</option>
              {ITEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
            {selectedType && (
              <div className="selection-preview">
                <div className={`type-badge type-${selectedType.value}`}>
                  <span>{selectedType.emoji}</span>
                  {selectedType.label}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="form-select"
              required
            >
              <option value="">Seleziona categoria</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="selection-preview">
                <div className="category-preview">
                  <span>{selectedCategory.emoji}</span>
                  <span>{selectedCategory.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Price (only for sale items) */}
          {formData.type === 'vendo' && (
            <div className="form-group">
              <label className="form-label">
                <Euro size={16} />
                Prezzo *
              </label>
              <div className="price-input-container">
                <span className="price-currency">€</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0"
                  className="form-input price-input"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <p className="form-hint">Inserisci un prezzo equo per il tuo oggetto</p>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Descrizione *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrivi l'oggetto, le condizioni, disponibilità..."
              className="form-textarea"
              rows={4}
              maxLength={500}
              required
            />
            <div className="char-count">{formData.description.length}/500</div>
          </div>

          {/* Location Display */}
          <div className="location-display">
            <div className="location-header">
              <MapPin size={16} />
              <span>La tua posizione</span>
            </div>
            <div className="location-text">{formData.location_text}</div>
            <p className="location-hint">
              Gli utenti nelle vicinanze (entro 500m) potranno vedere questo oggetto
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-btn submit-btn-large"
          >
            {loading ? 'Pubblicazione...' : 'Pubblica Oggetto'}
          </button>

          {/* Message Display */}
          {message && (
            <div className={`message ${
              message.includes('successo') ? 'message-success' : 'message-error'
            }`}>
              {message}
            </div>
          )}
        </form>
      </main>
    </div>
  )
}