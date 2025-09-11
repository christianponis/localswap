'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useFirebaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true, // Start with loading true
    error: null
  })

  useEffect(() => {
    console.log('🔥 Firebase Auth: Setting up auth listener')
    
    // Firebase auth state listener - very reliable
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('🔥 Firebase Auth state changed:', user?.email || 'No user')
        setState({
          user,
          loading: false, // Always set loading false when auth state is determined
          error: null
        })
      },
      (error) => {
        console.error('🔥 Firebase Auth error:', error)
        setState({
          user: null,
          loading: false,
          error: error.message
        })
      }
    )

    // Cleanup subscription on unmount
    return () => {
      console.log('🔥 Firebase Auth: Cleaning up auth listener')
      unsubscribe()
    }
  }, [])

  // Login with email/password
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      console.log('🔥 Firebase: Attempting login for', email)
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('🔥 Firebase: Login successful', userCredential.user.email)
      
      return { success: true }
    } catch (error: any) {
      console.error('🔥 Firebase: Login failed', error.message)
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { success: false, error: getFirebaseErrorMessage(error.code) }
    }
  }

  // Register new user
  const register = async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      console.log('🔥 Firebase: Creating account for', email)
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      
      console.log('🔥 Firebase: Account created successfully', userCredential.user.email)
      return { success: true }
    } catch (error: any) {
      console.error('🔥 Firebase: Registration failed', error.message)
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { success: false, error: getFirebaseErrorMessage(error.code) }
    }
  }

  // Send password reset email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔥 Firebase: Sending password reset to', email)
      await sendPasswordResetEmail(auth, email)
      console.log('🔥 Firebase: Password reset email sent')
      return { success: true }
    } catch (error: any) {
      console.error('🔥 Firebase: Password reset failed', error.message)
      return { success: false, error: getFirebaseErrorMessage(error.code) }
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      console.log('🔥 Firebase: Logging out')
      await signOut(auth)
      console.log('🔥 Firebase: Logout successful')
    } catch (error: any) {
      console.error('🔥 Firebase: Logout failed', error.message)
    }
  }

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    register, 
    resetPassword,
    logout
  }
}

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Nessun account trovato con questa email'
    case 'auth/wrong-password':
      return 'Password non corretta'
    case 'auth/email-already-in-use':
      return 'Email già registrata'
    case 'auth/weak-password':
      return 'Password troppo debole (minimo 6 caratteri)'
    case 'auth/invalid-email':
      return 'Email non valida'
    case 'auth/network-request-failed':
      return 'Errore di connessione. Riprova.'
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova più tardi.'
    default:
      return 'Errore di autenticazione. Riprova.'
  }
}