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

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
        }
        
        if (!mounted) return
        
        console.log('👤 Session user:', session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email)
        }
        
        console.log('✅ Initial session loaded, setting loading to false')
        setLoading(false)
      } catch (error) {
        console.error('❌ Error in getSession:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set a timeout fallback in case auth never resolves
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⏰ Auth timeout fallback triggered')
        setLoading(false)
      }
    }, 5000) // 5 second fallback

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
        clearTimeout(fallbackTimeout)
      }
    )

    return () => {
      mounted = false
      clearTimeout(fallbackTimeout)
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
    isAuthenticated: !!user
  }
}