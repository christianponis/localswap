'use client'

import { useState, useEffect } from 'react'
import { formatDistance, formatTimeAgo } from '@/lib/utils'
import { APP_CONFIG, CATEGORIES, ITEM_TYPES } from '@/lib/constants'
import { Plus, MapPin, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import { NotificationPanel } from '@/components/NotificationPanel'
import Link from 'next/link'

export default function HomePage() {
  const { user, profile, loading: authLoading, signOut, clearCorruptedAuth } = useAuth()
  const { showSuccess, showInfo, requestPermission, permission } = useNotifications()
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationStatus, setLocationStatus] = useState('Rilevamento posizione...')
  const [items, setItems] = useState<Array<{
    id: string
    title: string
    description: string
    category: string
    type: string
    price?: number
    distance_meters: number
    created_at: string
    username: string
    avatar_url?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  const supabase = createClient()

  useEffect(() => {
    requestLocation()
  }, [])

  useEffect(() => {
    if (location) {
      fetchNearbyItems()
    }
  }, [location, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show welcome notification for authenticated users
  useEffect(() => {
    if (user && !authLoading) {
      // Welcome notification
      setTimeout(() => {
        showInfo(
          'Benvenuto su LocalSwap!',
          'Esplora gli oggetti nel tuo vicinato o aggiungi qualcosa da condividere',
          { label: 'Aggiungi oggetto', url: '/add-item' }
        )
      }, 2000)

      // Request notification permission
      if (permission === 'default') {
        setTimeout(() => {
          requestPermission().then(granted => {
            if (granted) {
              showSuccess(
                'Notifiche attivate!', 
                'Ti avviseremo quando ci sono nuovi oggetti nel tuo vicinato'
              )
            }
          })
        }, 4000)
      }
    }
  }, [user, authLoading, permission]) // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('❌ Geolocalizzazione non supportata')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationStatus('✅ Posizione rilevata')
      },
      (error) => {
        console.warn('Geolocalizzazione non disponibile, usando posizione di demo')
        setLocationStatus('📍 Usando posizione di demo')
        // Usa posizione default per demo
        setLocation(APP_CONFIG.DEFAULT_LOCATION)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    )
  }

  const fetchNearbyItems = async () => {
    if (!location) return

    try {
      setLoading(true)
      
      console.log('Fetching items for location:', location)
      
      // Temporarily fetch all items to debug the issue
      const { data: allItems, error: fetchError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          description,
          category,
          type,
          price,
          currency,
          address_hint,
          status,
          created_at,
          user_id
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('Fetched items:', allItems)
      console.log('Fetch error:', fetchError)

      if (fetchError) {
        console.warn('Database error, usando dati di demo:', fetchError)
        setItems(getMockItems())
      } else if (allItems && allItems.length > 0) {
        // Format items to match expected structure
        const formattedItems = allItems.map(item => ({
          ...item,
          distance_meters: 100, // Fake distance for now
          username: 'Utente', // We'll fetch username separately later
          avatar_url: null
        }))
        setItems(formattedItems)
      } else {
        console.log('No real items found, using mock data')
        setItems(getMockItems())
      }
    } catch (error) {
      console.error('Error:', error)
      setItems(getMockItems())
    } finally {
      setLoading(false)
    }
  }

  const getMockItems = () => [
    {
      id: '1',
      title: 'Trapano Bosch',
      description: 'Trapano elettrico perfetto stato, lo presto per qualche ora',
      category: 'casa',
      type: 'presto',
      price: null,
      distance_meters: 150,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      username: 'mario_92',
      avatar_url: null,
    },
    {
      id: '2',
      title: 'Libro "Atomic Habits"',
      description: 'Finito di leggere, scambio con altro libro di crescita personale',
      category: 'libri',
      type: 'scambio',
      price: null,
      distance_meters: 280,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      username: 'reading_lover',
      avatar_url: null,
    },
    {
      id: '3',
      title: 'iPhone 12 usato',
      description: 'Ottime condizioni, passo a iPhone 15. Batteria 89%',
      category: 'elettronica',
      type: 'vendo',
      price: 450,
      distance_meters: 420,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      username: 'tech_guru',
      avatar_url: null,
    },
  ]

  const filteredItems = items.filter(item => {
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter
    const typeMatch = typeFilter === 'all' || item.type === typeFilter
    return categoryMatch && typeMatch
  })

  const getTypeInfo = (type: string) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0]
  }

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0]
  }

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <LocalSwapLogo size={64} className="animate-pulse" />
          <div className="empty-title">Caricamento LocalSwap...</div>
          <div className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
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
            <LocalSwapLogo size={36} />
          
            {user ? (
              <div className="auth-section">
                <NotificationPanel />
                <span className="username">
                  Ciao {profile?.username || user.email?.split('@')[0]}!
                </span>
                <button
                  onClick={signOut}
                  className="logout-btn"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="auth-section">
                <button
                  onClick={() => {
                    clearCorruptedAuth()
                    showInfo('Cookies puliti', 'Cache di autenticazione pulita. Riprova il login.')
                  }}
                  className="debug-btn"
                  title="Pulisci cache corrotta se il login non funziona"
                >
                  🧹
                </button>
                <Link href="/auth/login" className="login-btn">
                  <User size={16} />
                  Accedi
                </Link>
                {/* Fallback per browser con problemi JS */}
                <a 
                  href="/auth/login" 
                  className="login-btn"
                  style={{ marginLeft: '8px', fontSize: '12px' }}
                >
                  Login HTML
                </a>
              </div>
            )}
          </div>
          
          <div className="location-status">
            <MapPin size={16} />
            <span>{locationStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main">
        {/* Add Item Button */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {user ? (
            <Link href="/add-item">
              <button className="primary-btn">
                <Plus size={20} />
                Aggiungi oggetto
              </button>
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/auth/login">
                <button className="primary-btn">
                  <User size={20} />
                  Accedi per aggiungere
                </button>
              </Link>
              <button 
                onClick={() => setItems(getMockItems())}
                className="demo-btn"
              >
                🚀 Modalità Demo
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutte le categorie</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutti i tipi</option>
            {ITEM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.emoji} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Items List */}
        <div className="items-grid">
          {loading ? (
            <div className="loading">
              <div className="loading-skeleton skeleton-1"></div>
              <div className="loading-skeleton skeleton-2"></div>
              <div className="loading-skeleton skeleton-3"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">
                Nessun oggetto nelle vicinanze
              </h3>
              <p className="empty-description">
                Non ci sono oggetti nel raggio di 500m dalla tua posizione
              </p>
              {!user && (
                <Link href="/auth/login" className="empty-link">
                  Accedi per vedere tutti gli oggetti →
                </Link>
              )}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const typeInfo = getTypeInfo(item.type)
              const categoryInfo = getCategoryInfo(item.category)
              
              return (
                <div 
                  key={item.id} 
                  className="item-card"
                  style={{ 
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="item-header">
                    <h3 className="item-title">
                      {item.title}
                    </h3>
                    <div className="distance-badge">
                      {formatDistance(item.distance_meters)}
                    </div>
                  </div>
                  
                  <div className={`type-badge type-${item.type}`}>
                    <span>{typeInfo.emoji}</span>
                    {typeInfo.label}
                  </div>
                  
                  <p className="item-description">
                    {item.description}
                  </p>
                  
                  {item.price && (
                    <div className="item-price">
                      €{item.price}
                    </div>
                  )}
                  
                  <div className="item-footer">
                    <div className="category-info">
                      <span>{categoryInfo.emoji}</span>
                      <span>{categoryInfo.label}</span>
                    </div>
                    <div>
                      {formatTimeAgo(item.created_at)}
                    </div>
                  </div>
                  
                  {item.username && (
                    <div className="item-username">
                      da <span className="username-text">@{item.username}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {location && (
          <div className="location-info">
            <div className="location-header">
              <MapPin size={16} style={{ color: '#10b981' }} />
              <span>Raggio ricerca: {APP_CONFIG.MAX_RADIUS_METERS}m</span>
            </div>
            <div className="location-coords">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}