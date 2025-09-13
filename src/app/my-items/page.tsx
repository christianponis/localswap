'use client'

import React, { useState, useEffect } from 'react'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { Header } from '@/components/Header'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, MessageCircle, Package, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'

interface UserItem {
  id: string
  title: string
  description: string
  price: string
  category: string
  location: string
  images: string[]
  created_at: string
  status: 'active' | 'sold' | 'reserved'
  views?: number
  messages?: number
}

export default function MyItemsPage() {
  const { user, loading: authLoading } = useFirebaseAuth()
  const router = useRouter()
  const [items, setItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?next=/my-items')
    }
  }, [user, authLoading, router])

  // Load user's items
  useEffect(() => {
    if (user) {
      loadUserItems()
    }
  }, [user])

  const loadUserItems = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      // For now, we'll use mock data since there's no backend service yet
      const mockItems: UserItem[] = [
        {
          id: '1',
          title: 'iPhone 12 Pro',
          description: 'Ottimo stato, batteria al 90%',
          price: '500',
          category: 'Elettronica',
          location: 'Centro, Milano',
          images: ['/images/placeholder.svg'],
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'active',
          views: 24,
          messages: 3
        },
        {
          id: '2',
          title: 'Bicicletta mountain bike',
          description: 'Usata poco, perfetta per trail',
          price: '200',
          category: 'Sport',
          location: 'Porta Garibaldi, Milano',
          images: ['/images/placeholder.svg'],
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          status: 'sold',
          views: 45,
          messages: 8
        },
        {
          id: '3',
          title: 'Libreria IKEA',
          description: 'Come nuova, smontabile',
          price: '40',
          category: 'Casa',
          location: 'Navigli, Milano',
          images: ['/images/placeholder.svg'],
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          status: 'reserved',
          views: 12,
          messages: 2
        }
      ]
      setItems(mockItems)
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      // In a real implementation, this would call an API
      setItems(items.filter(item => item.id !== itemId))
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (error) {
      // Silently handle error
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'sold': return '#ef4444'
      case 'reserved': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo'
      case 'sold': return 'Venduto'
      case 'reserved': return 'Prenotato'
      default: return 'Sconosciuto'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento annunci...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />
      
      <main className="my-items-container">
        <div className="my-items-header">
          <div className="my-items-title">
            <Package size={28} />
            <h1>I miei annunci</h1>
          </div>
          <Link href="/add-item" className="add-item-btn">
            + Aggiungi annuncio
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h2>Nessun annuncio pubblicato</h2>
            <p>Non hai ancora pubblicato alcun annuncio. Inizia a vendere i tuoi oggetti!</p>
            <Link href="/add-item" className="add-first-item-btn">
              Pubblica il primo annuncio
            </Link>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-image-container">
                  <img
                    src={item.images[0] || '/images/placeholder.svg'}
                    alt={item.title}
                    className="item-image"
                  />
                  <div 
                    className="item-status-badge"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {getStatusText(item.status)}
                  </div>
                </div>
                
                <div className="item-content">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-description">{item.description}</p>
                  <div className="item-price">€{item.price}</div>
                  
                  <div className="item-meta">
                    <div className="item-meta-row">
                      <MapPin size={14} />
                      <span>{item.location}</span>
                    </div>
                    <div className="item-meta-row">
                      <Calendar size={14} />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="item-stats">
                    <div className="stat">
                      <Eye size={16} />
                      <span>{item.views || 0} visualizzazioni</span>
                    </div>
                    <div className="stat">
                      <MessageCircle size={16} />
                      <span>{item.messages || 0} messaggi</span>
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <Link
                      href={`/edit-item/${item.id}`}
                      className="action-btn edit-btn"
                    >
                      <Edit size={16} />
                      <span>Modifica</span>
                    </Link>
                    <Link
                      href={`/messages?item=${item.id}`}
                      className="action-btn messages-btn"
                    >
                      <MessageCircle size={16} />
                      <span>Messaggi</span>
                    </Link>
                    <button
                      onClick={() => {
                        setItemToDelete(item.id)
                        setDeleteModalOpen(true)
                      }}
                      className="action-btn delete-btn"
                    >
                      <Trash2 size={16} />
                      <span>Elimina</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Conferma eliminazione</h3>
            <p>Sei sicuro di voler eliminare questo annuncio? L'azione non può essere annullata.</p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setItemToDelete(null)
                }}
                className="modal-btn cancel-btn"
              >
                Annulla
              </button>
              <button
                onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
                className="modal-btn delete-btn"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}