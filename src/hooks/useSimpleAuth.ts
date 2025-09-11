'use client'

import { useState, useEffect } from 'react'
import { simpleAuth, type User, type AuthState } from '@/lib/auth-simple'

export function useSimpleAuth() {
  const [state, setState] = useState<AuthState>(() => simpleAuth.getState())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = simpleAuth.subscribe((newState) => {
      setState(newState)
    })

    // Get initial state
    setState(simpleAuth.getState())
    
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await simpleAuth.login(email, password)
      return result
    } finally {
      setLoading(false)
    }
  }

  const loginWithEmailLink = async (email: string) => {
    setLoading(true)
    try {
      const result = await simpleAuth.loginWithEmailLink(email)
      return result
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    simpleAuth.logout()
  }

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading,
    login,
    loginWithEmailLink,
    logout
  }
}