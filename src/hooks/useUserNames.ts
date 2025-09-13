import { useState, useEffect } from 'react'
import { useFirebaseAuth } from './useFirebaseAuth'

// Cache for user display names to avoid repeated lookups
const userNameCache = new Map<string, string>()

export function useUserNames() {
  const { user } = useFirebaseAuth()
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map())

  // Function to get display name for a user ID
  const getUserDisplayName = (userId: string): string => {
    // Check cache first
    if (userNameCache.has(userId)) {
      return userNameCache.get(userId)!
    }

    // Check if it's the current user
    if (user && user.uid === userId) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Tu'
      userNameCache.set(userId, displayName)
      return displayName
    }

    // For other users, create a friendly name from their ID
    let displayName = 'Utente'
    
    if (userId.includes('@')) {
      // Extract and clean username from email
      const username = userId.split('@')[0]
      displayName = username.charAt(0).toUpperCase() + username.slice(1).replace(/[0-9]+$/, '')
    } else if (userId.length > 3) {
      // Use first few characters if not an email
      displayName = userId.substring(0, 8)
    }

    // Cache the result
    userNameCache.set(userId, displayName)
    return displayName
  }

  // Function to set a known user name (e.g., from conversation data)
  const setUserName = (userId: string, name: string) => {
    userNameCache.set(userId, name)
    setUserNames(new Map(userNameCache))
  }

  // Function to clear cache (useful for logout)
  const clearUserNames = () => {
    userNameCache.clear()
    setUserNames(new Map())
  }

  return {
    getUserDisplayName,
    setUserName,
    clearUserNames
  }
}