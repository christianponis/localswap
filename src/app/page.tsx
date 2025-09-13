'use client'

import { useState, useEffect } from 'react'
import { APP_CONFIG, getAllCategories, getAllTypes, ITEM_KINDS } from '@/lib/constants'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import { BottomNavigation } from '@/components/BottomNavigation'
import { AdBanner } from '@/components/AdBanner'
import { SwipeableStack } from '@/components/SwipeableStack'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading: authLoading, logout } = useFirebaseAuth()
  const { showSuccess, showInfo, requestPermission, permission } = useNotifications()
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationStatus, setLocationStatus] = useState('Rilevamento posizione...')
  const [items, setItems] = useState<Array<{
    id: string
    title: string
    description: string
    kind: string
    category: string
    type: string
    price?: number
    distance_meters: number
    created_at: string
    username: string
    avatar_url?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [kindFilter, setKindFilter] = useState('all')
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
  }, [location, user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Force refetch items when auth state changes (login/logout)
  useEffect(() => {
    if (!authLoading && location) {
      console.log('🔥 Firebase auth state changed, refetching items...')
      fetchNearbyItems()
    }
  }, [user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

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
      (err) => {
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
          kind,
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
        .limit(10) as {
          data: Array<{
            id: string
            title: string
            description: string
            kind: string
            category: string
            type: string
            price: number | null
            currency: string
            address_hint: string
            status: string
            created_at: string
            user_id: string
          }> | null,
          error: any
        }

      console.log('Fetched items:', allItems)
      console.log('Fetch error:', fetchError)

      if (fetchError) {
        console.warn('Database error, usando dati di demo:', fetchError)
        setItems(getMockItems())
      } else if (allItems && allItems.length > 0) {
        // Helper function to extract username from Firebase UID/email
        const extractUsername = (userId: string): string => {
          if (!userId) return 'Utente'

          if (userId.includes('@')) {
            // Extract username from email and make it friendly
            const username = userId.split('@')[0]
            // Remove numbers and capitalize first letter
            const cleanName = username.replace(/[0-9]+$/g, '')
            return cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
          }

          // If it's not an email, create a friendly short name
          return userId.length > 8 ? userId.substring(0, 8) : userId
        }

        // Format items to match expected structure
        const formattedItems = allItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          kind: item.kind || 'object',
          category: item.category,
          type: item.type,
          price: item.price || undefined,
          distance_meters: 100,
          created_at: item.created_at,
          username: extractUsername(item.user_id),
          avatar_url: undefined
        }))
        setItems(formattedItems)
      } else {
        console.log('No real items found, using mock data')
        setItems(getMockItems())
      }
    } catch (err) {
      console.error('Error:', err)
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
      kind: 'object',
      category: 'casa',
      type: 'presto',
      price: undefined,
      distance_meters: 150,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      username: 'mario_92',
      avatar_url: undefined,
    },
    {
      id: '2',
      title: 'Ripetizioni Matematica',
      description: 'Laureato in Ingegneria, disponibile per ripetizioni di matematica e fisica',
      kind: 'service',
      category: 'ripetizioni',
      type: 'offro',
      price: 25,
      distance_meters: 280,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      username: 'prof_marco',
      avatar_url: undefined,
    },
    {
      id: '3',
      title: 'iPhone 12 usato',
      description: 'Ottime condizioni, passo a iPhone 15. Batteria 89%',
      kind: 'object',
      category: 'elettronica',
      type: 'vendo',
      price: 450,
      distance_meters: 420,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      username: 'tech_guru',
      avatar_url: undefined,
    },
  ]

  const filteredItems = items.filter(item => {
    const kindMatch = kindFilter === 'all' || item.kind === kindFilter
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter
    const typeMatch = typeFilter === 'all' || item.type === typeFilter
    return kindMatch && categoryMatch && typeMatch
  })

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="empty-title">Caricamento LocalSwap...</div>
          <div className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Header
        user={user}
        onLogout={logout}
        locationStatus={locationStatus}
        showLocation={true}
      />

      {/* Top Ad Banner */}
      <AdBanner position="top" type="banner" />

      {/* Main Content - No Scroll */}
      <main className="main-content-fullscreen">
        {/* Filters - Fixed Top */}
        <div className="filters-fixed">
          <select 
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutto</option>
            {ITEM_KINDS.map(kind => (
              <option key={kind.value} value={kind.value}>
                {kind.emoji} {kind.label}
              </option>
            ))}
          </select>
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tutte le categorie</option>
            {getAllCategories().map(cat => (
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
            {getAllTypes().map(type => (
              <option key={type.value} value={type.value}>
                {type.emoji} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Swipeable Stack */}
        <div className="swipe-container">
          {loading ? (
            <div className="loading-stack">
              <div className="loading-skeleton skeleton-card"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">
                {kindFilter === 'object'
                  ? 'Nessun oggetto nelle vicinanze'
                  : kindFilter === 'service'
                  ? 'Nessun servizio nelle vicinanze'
                  : 'Niente nelle vicinanze'
                }
              </h3>
              <p className="empty-description">
                {kindFilter === 'object'
                  ? 'Non ci sono oggetti nel raggio di 500m dalla tua posizione'
                  : kindFilter === 'service'
                  ? 'Non ci sono servizi offerti nel raggio di 500m dalla tua posizione'
                  : 'Non ci sono oggetti o servizi nel raggio di 500m dalla tua posizione'
                }
              </p>
              {!user && (
                <Link href="/auth/login" className="empty-link">
                  Accedi per vedere tutto →
                </Link>
              )}
            </div>
          ) : (
            <SwipeableStack items={filteredItems} user={user} />
          )}
        </div>

        {/* Demo Button in Filters */}
        {!user && filteredItems.length === 0 && (
          <div className="demo-hint">
            <button
              onClick={() => setItems(getMockItems())}
              className="demo-btn-inline"
            >
              🚀 Carica dati demo
            </button>
          </div>
        )}
      </main>

      <BottomNavigation user={user} />
    </div>
  )
}