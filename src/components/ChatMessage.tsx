'use client'

import React from 'react'
import { formatTimeAgo } from '@/lib/utils'
import { Check, CheckCheck } from 'lucide-react'

export interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
  message_type?: 'text' | 'image' | 'system'
}

interface ChatMessageProps {
  message: Message
  isOwn: boolean
  senderName?: string
  showSender?: boolean
  className?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  senderName,
  showSender = false,
  className = ""
}) => {
  const isRead = !!message.read_at
  const isSystem = message.message_type === 'system'

  if (isSystem) {
    return (
      <div className={`chat-message-system ${className}`}>
        <span className="system-text">{message.content}</span>
        <span className="system-time">{formatTimeAgo(message.created_at)}</span>
      </div>
    )
  }

  return (
    <div className={`chat-message ${isOwn ? 'own' : 'other'} ${className}`}>
      {showSender && !isOwn && (
        <div className="message-sender">{senderName || 'Utente'}</div>
      )}
      
      <div className="message-bubble">
        <div className="message-content">{message.content}</div>
        
        <div className="message-footer">
          <span className="message-time">
            {formatTimeAgo(message.created_at)}
          </span>
          
          {isOwn && (
            <div className="message-status">
              {isRead ? (
                <CheckCheck size={14} className="status-read" />
              ) : (
                <Check size={14} className="status-sent" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}