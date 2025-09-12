'use client'

import React, { useState } from 'react'
import { Bell, X } from 'lucide-react'

interface NotificationButtonProps {
  className?: string
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState([
    {
      id: '1',
      title: 'Nuovo oggetto disponibile',
      message: 'Mario ha aggiunto "Trapano Bosch" a 150m da te',
      time: '2 minuti fa',
      unread: true
    },
    {
      id: '2',
      title: 'Messaggio ricevuto',
      message: 'Hai ricevuto un messaggio da Giulia',
      time: '1 ora fa',
      unread: true
    }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className={`notification-container ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="notification-btn"
        aria-label="Notifiche"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifiche</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="notification-close"
              aria-label="Chiudi notifiche"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.unread ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  {notification.unread && (
                    <div className="notification-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="notification-clear">
                Segna tutte come lette
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}