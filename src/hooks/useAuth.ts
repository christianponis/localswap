'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Aggressive clear of all browser data that might interfere
  const clearCorruptedAuth = () => {
    if (typeof window !== 'undefined') {
      try {
        console.log('🧹 Aggressive cleanup: removing all potential interfering data')
        
        // Clear ALL localStorage (not just supabase)
        localStorage.clear()
        
        // Clear ALL sessionStorage  
        sessionStorage.clear()
        
        // Clear all cookies for this domain
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=" + window.location.hostname)
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=." + window.location.hostname)
        })
        
        // Clear caches if available
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name)
            })
          })
        }
        
        console.log('✅ Aggressive cleanup completed')
      } catch (error) {
        console.log('⚠️ Some cleanup operations failed:', error)
      }
    }
  }

  useEffect(() => {
    let mounted = true
    let initialLoadComplete = false

    // Aggressive storage cleanup on every app start for browser issues
    console.log('🧹 Starting aggressive storage cleanup for browser compatibility')
    clearCorruptedAuth()

    // Immediate fallback - set loading false after 100ms if nothing happens
    const quickTimeout = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.log('⚡ Quick loading fallback')
        setLoading(false)
        initialLoadComplete = true
      }
    }, 100)

    // Force loading to false after 3 seconds max
    const loadingTimeout = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.log('⏰ Auth loading timeout, forcing completion')
        setLoading(false)
        initialLoadComplete = true
      }
    }, 3000)

    // Get initial session with timeout
    const sessionPromise = Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )
    ])

    sessionPromise
      .then(({ data: { session } }) => {
        if (!mounted || initialLoadComplete) return
        console.log('✅ Initial session check:', session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email)
        }
        setLoading(false)
        initialLoadComplete = true
        clearTimeout(quickTimeout)
        clearTimeout(loadingTimeout)
      })
      .catch(error => {
        if (!mounted || initialLoadComplete) return
        console.log('⚠️ Session check failed:', error.message)
        setLoading(false)
        initialLoadComplete = true
        clearTimeout(quickTimeout)
        clearTimeout(loadingTimeout)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth event:', event, session?.user?.email || 'No user')
        
        if (event === 'SIGNED_OUT' || !session) {
          clearCorruptedAuth()
          setUser(null)
          setProfile(null)
        } else if (session?.user) {
          console.log('✅ User authenticated, updating state')
          setUser(session.user)
          try {
            await fetchProfile(session.user.id, session.user.email)
          } catch (error) {
            console.error('Profile fetch error:', error)
          }
          // Trigger a custom event to notify components of auth success
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-success'))
          }
        }
        
        if (!initialLoadComplete) {
          setLoading(false)
          initialLoadComplete = true
          clearTimeout(quickTimeout)
          clearTimeout(loadingTimeout)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(quickTimeout)
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a basic one
        const basicProfile = {
          id: userId,
          username: userEmail?.split('@')[0] || 'utente',
          email: userEmail || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(basicProfile as any)
        return
      }

      if (data) {
        const profileData = {
          ...data,
          location: data.location ? parseLocation(data.location) : null
        }
        setProfile(profileData)
      }
    } catch (error) {
      // Create fallback profile
      const basicProfile = {
        id: userId,
        username: userEmail?.split('@')[0] || 'utente', 
        email: userEmail || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setProfile(basicProfile as any)
    }
  }

  const parseLocation = (location: any) => {
    try {
      if (typeof location === 'string') {
        const match = location.match(/POINT\(([^\s]+)\s+([^\)]+)\)/)
        if (match) {
          return {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2])
          }
        }
      }
      return location
    } catch {
      return null
    }
  }

  const signOut = async () => {
    clearCorruptedAuth()
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const profileData = {
          ...data,
          location: data.location ? parseLocation(data.location) : null
        }
        setProfile(profileData)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }
}