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

  // Function to clear corrupted auth data
  const clearAuthData = () => {
    console.log('🧹 Clearing potentially corrupted auth data...')
    // Clear localStorage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('next')) {
          localStorage.removeItem(key)
          console.log('🗑️ Removed localStorage:', key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('next')) {
          sessionStorage.removeItem(key)
          console.log('🗑️ Removed sessionStorage:', key)
        }
      })
      
      // Clear all cookies for this domain
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      console.log('🍪 Cleared all cookies')
    }
  }

  useEffect(() => {
    let mounted = true
    let initialLoadComplete = false

    // Simple immediate loading completion with auth listener only
    console.log('🔄 Setting up auth listener only approach...')
    
    // Set loading to false immediately and rely on auth state changes
    setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.log('⚡ Quick load: setting loading to false immediately')
        setLoading(false)
        initialLoadComplete = true
      }
    }, 100)

    // Listen for auth changes - this is the primary way to detect auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        
        // Handle sign out or auth errors by clearing corrupted data
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.log('🚪 Auth signed out or token refresh failed, clearing data...')
          clearAuthData()
          setUser(null)
          setProfile(null)
        } else if (session?.user) {
          console.log('✅ User found in auth change, fetching profile...')
          setUser(session.user)
          
          try {
            await fetchProfile(session.user.id, session.user.email)
          } catch (error) {
            console.error('❌ Profile fetch error:', error)
            // Create basic profile even if fetch fails
            const basicProfile = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'utente',
              email: session.user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(basicProfile as any)
          }
        } else {
          console.log('🚪 No user in auth change')
          setUser(null)
          setProfile(null)
        }
        
        if (!initialLoadComplete) {
          console.log('✅ Auth event completed initial loading')
          setLoading(false)
          initialLoadComplete = true
        }
      }
    )

    // Try to get initial session in background (no timeout, no blocking)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      
      console.log('🔍 Background session check:', session?.user?.email || 'No user', error?.message || 'No error')
      
      if (session?.user && session.user !== user) {
        console.log('📝 Background session found different user, updating...')
        setUser(session.user)
        fetchProfile(session.user.id, session.user.email).catch(console.error)
      }
    }).catch(error => {
      console.log('🔍 Background session check failed:', error.message)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('👤 Fetching profile for user:', userId, userEmail)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('🔍 Profile fetch error:', error.code, error.message)
        // If profiles table doesn't exist or no profile found, create a basic profile from user data
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('📝 No profile found, creating basic user info')
          // Create a basic profile from user email
          const basicProfile = {
            id: userId,
            username: userEmail?.split('@')[0] || 'utente',
            email: userEmail || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('✅ Basic profile created:', basicProfile)
          setProfile(basicProfile as any)
          return
        }
        console.error('❌ Profile error, creating fallback:', error)
        // Still set a basic profile to not block the app
        const basicProfile = {
          id: userId,
          username: userEmail?.split('@')[0] || 'utente',
          email: userEmail || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ Fallback profile created:', basicProfile)
        setProfile(basicProfile as any)
        return
      }

      if (data) {
        // Parse location if it exists
        const profileData = {
          ...data,
          location: data.location ? parseLocation(data.location) : null
        }
        setProfile(profileData)
      } else {
        // No profile data, create basic from user
        const basicProfile = {
          id: userId,
          username: userEmail?.split('@')[0] || 'utente',
          email: userEmail || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(basicProfile as any)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Still set a basic profile to not block the app
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
        // Parse PostGIS POINT format: "POINT(lng lat)"
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
    console.log('🚪 Signing out user...')
    clearAuthData()
    await supabase.auth.signOut()
  }

  const clearCorruptedAuth = () => {
    console.log('🧹 Manual auth cleanup requested')
    clearAuthData()
    setUser(null)
    setProfile(null)
    // Trigger a refresh of the auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.log('✅ Auth cleared successfully')
      }
    })
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
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    clearCorruptedAuth,
    isAuthenticated: !!user
  }
}