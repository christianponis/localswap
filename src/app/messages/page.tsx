'use client'

import React, { useState, useEffect } from 'react'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { Header } from '@/components/Header'
import { ChatWindow } from '@/components/ChatWindow'
import { formatTimeAgo } from '@/lib/utils'
import { MessageCircle, Search, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { chatService, type Conversation, type Message } from '@/lib/chatService'

export default function MessagesPage() {
  const { user, loading: authLoading } = useFirebaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?next=/messages')
    }
  }, [user, authLoading, router])

  // Load conversations
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Handle URL parameters for direct conversation access
  useEffect(() => {
    const itemId = searchParams.get('item')
    const otherUserId = searchParams.get('user')
    
    if (itemId && otherUserId && user) {
      // Handle creating/opening conversation from URL params
      handleDirectMessage(itemId, otherUserId)
    }
  }, [searchParams, user])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const convs = await chatService.getConversations(user.uid)
      setConversations(convs)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return
    
    try {
      setMessagesLoading(true)
      const msgs = await chatService.getMessages(conversationId)
      setMessages(msgs)
      
      // Mark messages as read
      if (user) {
        await chatService.markMessagesAsRead(conversationId, user.uid)
        // Refresh conversations to update unread counts
        loadConversations()
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleDirectMessage = async (itemId: string, _otherUserId: string) => {
    if (!user) return

    try {
      const conversationId = await chatService.getOrCreateConversation(itemId, user.uid)
      
      if (conversationId) {
        // Refresh conversations to include the new one
        const updatedConversations = await chatService.getConversations(user.uid)
        setConversations(updatedConversations)
        
        // Find and select the conversation
        const conv = updatedConversations.find(c => c.id === conversationId || c.item_id === itemId)
        if (conv) {
          setSelectedConversation(conv)
          loadMessages(conv.id)
        }
      }
    } catch (error) {
      // Silently handle error and continue with mock data
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    loadMessages(conversation.id)
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !user) return

    try {
      const newMessage = await chatService.sendMessage(selectedConversation.id, user.uid, content)
      
      if (newMessage) {
        // Add message to current messages
        setMessages(prev => [...prev, newMessage])
        
        // Update conversation's last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, last_message: content, last_message_time: newMessage.created_at }
              : conv
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.item_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="empty-title">Caricamento...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will be redirected
  }

  return (
    <div className="app-container">
      <Header user={user} />

      <main className="main">
        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-panel">
            <div className="conversations-header">
              <div className="conversations-header-top">
                <Link href="/" className="back-to-home-btn">
                  <ArrowLeft size={18} />
                  <span>Home</span>
                </Link>
                <h2 className="conversations-title">
                  <MessageCircle size={24} />
                  Messaggi
                </h2>
              </div>
              
              <div className="search-container">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cerca conversazioni..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="conversations-loading">
                  <div className="loading-skeleton"></div>
                  <div className="loading-skeleton"></div>
                  <div className="loading-skeleton"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="conversations-empty">
                  <MessageCircle size={48} />
                  <p>Nessuna conversazione</p>
                  <p className="empty-hint">
                    Inizia a chattare interessandoti agli oggetti degli altri utenti!
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  >
                    <div className="conversation-avatar">
                      <span className="avatar-initial">
                        {conversation.other_user_name[0].toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <span className="conversation-name">{conversation.other_user_name}</span>
                        <span className="conversation-time">
                          {formatTimeAgo(conversation.last_message_time)}
                        </span>
                      </div>
                      
                      <div className="conversation-preview">
                        <span className="item-title">{conversation.item_title}</span>
                        <span className="last-message">{conversation.last_message}</span>
                      </div>
                    </div>
                    
                    {conversation.unread_count > 0 && (
                      <div className="unread-badge">{conversation.unread_count}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="chat-panel">
            {selectedConversation ? (
              <ChatWindow
                conversation={{
                  id: selectedConversation.id,
                  item_title: selectedConversation.item_title,
                  other_user_name: selectedConversation.other_user_name,
                  other_user_id: selectedConversation.other_user_id
                }}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={() => setSelectedConversation(null)}
                loading={messagesLoading}
              />
            ) : (
              <div className="chat-placeholder">
                <MessageCircle size={64} />
                <h3>Seleziona una conversazione</h3>
                <p>Scegli una conversazione dalla lista per iniziare a chattare</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}