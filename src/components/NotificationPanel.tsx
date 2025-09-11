'use client'

import { useState } from 'react'
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/useNotifications'

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications()

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />
      case 'error': return <AlertCircle size={16} />
      case 'warning': return <AlertTriangle size={16} />
      case 'info': return <Info size={16} />
      default: return <Bell size={16} />
    }
  }

  const getTypeClass = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'notification-success'
      case 'error': return 'notification-error'
      case 'warning': return 'notification-warning'
      case 'info': return 'notification-info'
      default: return 'notification-info'
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Ora'
    if (minutes < 60) return `${minutes}m fa`
    if (hours < 24) return `${hours}h fa`
    return `${days}g fa`
  }

  return (
    <div className="notification-container">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-bell"
        aria-label={`Notifiche ${unreadCount > 0 ? `(${unreadCount} non lette)` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          <div 
            className="notification-overlay" 
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-panel">
            {/* Header */}
            <div className="notification-header">
              <h3>Notifiche</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="action-btn"
                    title="Segna tutte come lette"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="action-btn"
                  title="Chiudi"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={48} />
                  <p>Nessuna notifica</p>
                  <span>Quando succede qualcosa di importante, te lo faremo sapere!</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${getTypeClass(notification.type)} ${
                      !notification.read ? 'unread' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                      
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        {notification.action && (
                          <a
                            href={notification.action.url}
                            className="notification-action"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notification.action.label}
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="notification-remove"
                      title="Rimuovi notifica"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notification-footer">
                <button onClick={clearAll} className="clear-all-btn">
                  Cancella tutte
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}