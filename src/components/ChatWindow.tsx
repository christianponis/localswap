'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, MoreVertical } from 'lucide-react'
import { ChatMessage, type Message } from './ChatMessage'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'

interface ChatWindowProps {
  conversation: {
    id: string
    item_title: string
    other_user_name: string
    other_user_id: string
  }
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
  onBack?: () => void
  loading?: boolean
  className?: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onBack,
  loading = false,
  className = ""
}) => {
  const { user } = useFirebaseAuth()
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await onSendMessage(newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={`chat-window ${className}`}>
      {/* Chat Header */}
      <div className="chat-header">
        {onBack && (
          <button onClick={onBack} className="chat-back-btn">
            <ArrowLeft size={20} />
          </button>
        )}
        
        <div className="chat-header-info">
          <h3 className="chat-title">{conversation.other_user_name}</h3>
          <p className="chat-subtitle">
            Riguardo: <span className="item-title">{conversation.item_title}</span>
          </p>
        </div>
        
        <button className="chat-menu-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
            <div className="loading-skeleton"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>Inizia la conversazione!</p>
            <p className="chat-empty-hint">
              Scrivi un messaggio per chiedere informazioni su "{conversation.item_title}"
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.uid
              const showSender = !isOwn && (
                index === 0 || 
                messages[index - 1].sender_id !== message.sender_id
              )
              
              // Get the actual sender name based on sender_id
              const getSenderName = (senderId: string) => {
                if (senderId === user?.uid) {
                  return user?.displayName || user?.email?.split('@')[0] || 'Tu'
                }
                return conversation.other_user_name || 'Utente'
              }
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  senderName={getSenderName(message.sender_id)}
                  showSender={showSender}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Scrivi a ${conversation.other_user_name}...`}
            className="chat-input"
            rows={1}
            disabled={sending}
          />
          
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}