'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Euro, Clock, Tag, FileText, Camera } from 'lucide-react'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import { 
  CATEGORIES, ITEM_TYPES, APP_CONFIG, 
  ITEM_KINDS, getCategoriesForKind, getTypesForKind,
  OBJECT_CATEGORIES, SERVICE_CATEGORIES,
  OBJECT_TYPES, SERVICE_TYPES
} from '@/lib/constants'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { ImageUpload } from '@/components/ImageUpload'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AddItemPage() {
  const { user, loading: authLoading } = useFirebaseAuth()
  const { showSuccess, showError } = useNotifications()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Debug auth status and redirect if not authenticated
  useEffect(() => {
    console.log('AddItem Auth status:', { user: user?.uid, email: user?.email, authLoading })
    
    // Redirect to login if not authenticated and auth loading is complete
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.push('/auth/login?next=/add-item')
    }
  }, [user, authLoading, router])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    kind: 'object' as 'object' | 'service', // Nuovo campo: oggetto o servizio
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

    // Validazione prezzo per vendita oggetti
    if (formData.kind === 'object' && formData.type === 'vendo' && (!formData.price || parseFloat(formData.price) <= 0)) {
      setMessage('Inserisci un prezzo valido per gli oggetti in vendita')
      return
    }
    
    // Validazione prezzo per servizi (opzionale)
    if (formData.kind === 'service' && formData.price && parseFloat(formData.price) <= 0) {
      setMessage('Se specifichi un prezzo, deve essere maggiore di 0')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        kind: formData.kind,
        category: formData.category,
        type: formData.type,
        price: (formData.price && parseFloat(formData.price) > 0) ? parseFloat(formData.price) : null,
        currency: 'EUR',
        location: `SRID=4326;POINT(${formData.location_lng} ${formData.location_lat})`,
        address_hint: formData.location_text,
        images: formData.images,
        user_id: user.uid,
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
        console.error('User info:', { user: user?.uid, email: user?.email })
        
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
        var itemKindLabel = formData.kind === 'object' ? 'Oggetto' : 'Servizio'
        setMessage(`${itemKindLabel} aggiunto con successo!`)
        console.log('Item created successfully:', data)
        
        // Show success notification
        itemKindLabel = formData.kind === 'object' ? 'Oggetto' : 'Servizio'
        showSuccess(
          `${itemKindLabel} pubblicato!`,
          `"${formData.title}" è ora visibile ai tuoi vicini`,
          { label: 'Visualizza', url: '/' }
        )
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          kind: 'object',
          category: '',
          type: '',
          price: '',
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          location_text: formData.location_text,
          images: []
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Resetta categoria e tipo quando si cambia il kind
      if (field === 'kind') {
        updated.category = ''
        updated.type = ''
        updated.price = ''
      }
      
      return updated
    })
  }

  // Ottieni le categorie e tipi appropriati in base al kind
  const availableCategories = getCategoriesForKind(formData.kind)
  const availableTypes = getTypesForKind(formData.kind)
  
  const selectedType = availableTypes.find(t => t.value === formData.type)
  const selectedCategory = availableCategories.find(c => c.value === formData.category)
  const selectedKind = ITEM_KINDS.find(k => k.value === formData.kind)

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
          <h1 className="page-title">
            {formData.kind === 'object' ? 'Aggiungi Oggetto' : 'Offri Servizio'}
          </h1>
          <p className="page-subtitle">
            {formData.kind === 'object' 
              ? 'Condividi qualcosa con i tuoi vicini'
              : 'Offri i tuoi servizi nel vicinato'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Kind Selection */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} />
              Cosa vuoi condividere? *
            </label>
            <div className="kind-selector">
              {ITEM_KINDS.map(kind => (
                <button
                  key={kind.value}
                  type="button"
                  onClick={() => handleInputChange('kind', kind.value)}
                  className={`kind-option ${formData.kind === kind.value ? 'kind-option-active' : ''}`}
                >
                  <span className="kind-emoji">{kind.emoji}</span>
                  <div className="kind-text">
                    <div className="kind-label">{kind.label}</div>
                    <div className="kind-description">{kind.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="form-group">
            <label className="form-label">
              <Camera size={16} />
              {formData.kind === 'object' ? 'Foto dell\'oggetto' : 'Foto del servizio (opzionale)'}
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
              placeholder={formData.kind === 'object' 
                ? 'es. Trapano elettrico Bosch'
                : 'es. Ripetizioni di matematica'
              }
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
              {availableTypes.map(type => (
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
              {availableCategories.map(cat => (
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

          {/* Price */}
          {(formData.kind === 'object' && formData.type === 'vendo') || 
           (formData.kind === 'service') ? (
            <div className="form-group">
              <label className="form-label">
                <Euro size={16} />
                {formData.kind === 'object' && formData.type === 'vendo' 
                  ? 'Prezzo *' 
                  : 'Prezzo (opzionale)'
                }
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
                  required={formData.kind === 'object' && formData.type === 'vendo'}
                />
              </div>
              <p className="form-hint">
                {formData.kind === 'object' 
                  ? 'Inserisci un prezzo equo per il tuo oggetto'
                  : 'Tariffa oraria, a progetto o lascia vuoto per accordi diretti'
                }
              </p>
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
              placeholder={formData.kind === 'object'
                ? "Descrivi l'oggetto, le condizioni, disponibilità..."
                : "Descrivi il servizio, la tua esperienza, disponibilità..."
              }
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
              Gli utenti nelle vicinanze (entro 500m) potranno vedere questo {formData.kind === 'object' ? 'oggetto' : 'servizio'}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-btn submit-btn-large"
          >
            {loading 
              ? 'Pubblicazione...' 
              : `Pubblica ${formData.kind === 'object' ? 'Oggetto' : 'Servizio'}`
            }
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