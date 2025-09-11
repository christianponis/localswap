'use client'

import { useState, useEffect } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
  read: boolean
  action?: {
    label: string
    url: string
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Controlla permessi notifiche browser
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    
    // Carica notifiche salvate dal localStorage
    const saved = localStorage.getItem('localswap_notifications')
    if (saved) {
      try {
        setNotifications(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved notifications:', error)
      }
    }
  }, [])

  // Salva notifiche nel localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem('localswap_notifications', JSON.stringify(notifications))
  }, [notifications])

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50 notifications

    // Mostra notifica browser se autorizzato
    if (permission === 'granted' && 'Notification' in window) {
      try {
        const browserNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/icon-72.png',
          tag: newNotification.id,
          renotify: false
        })

        // Auto-close dopo 5 secondi
        setTimeout(() => browserNotif.close(), 5000)

        // Gestisci click su notifica
        browserNotif.onclick = () => {
          window.focus()
          if (notification.action?.url) {
            window.location.href = notification.action.url
          }
          browserNotif.close()
        }
      } catch (error) {
        console.error('Error showing browser notification:', error)
      }
    }

    return newNotification.id
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Helper functions
  const showSuccess = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'success', action })
  }

  const showError = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'error', action })
  }

  const showInfo = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'info', action })
  }

  const showWarning = (title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'warning', action })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
}