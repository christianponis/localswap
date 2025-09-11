'use client'

// Simple Authentication System - No external dependencies
interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

class SimpleAuth {
  private static instance: SimpleAuth
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false
  }
  private listeners: Array<(state: AuthState) => void> = []
  private storageKey = 'localswap_auth'

  constructor() {
    this.loadFromStorage()
  }

  static getInstance(): SimpleAuth {
    if (!SimpleAuth.instance) {
      SimpleAuth.instance = new SimpleAuth()
    }
    return SimpleAuth.instance
  }

  // Load auth state from localStorage
  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Check if token is still valid (simple expiry check)
        if (this.isTokenValid(parsed.token)) {
          this.state = {
            ...parsed,
            isAuthenticated: true
          }
          console.log('✅ Auth loaded from storage:', this.state.user?.email)
        } else {
          console.log('⚠️ Stored token expired, clearing auth')
          this.clearStorage()
        }
      }
    } catch (error) {
      console.log('⚠️ Error loading auth from storage:', error)
      this.clearStorage()
    }
  }

  // Save auth state to localStorage
  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state))
    } catch (error) {
      console.log('⚠️ Error saving auth to storage:', error)
    }
  }

  // Clear storage
  private clearStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.storageKey)
  }

  // Simple token validation (check if it's not expired)
  private isTokenValid(token: string | null): boolean {
    if (!token) return false
    
    try {
      // Simple JWT parsing (just check expiry)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      return payload.exp > now
    } catch {
      return false
    }
  }

  // Generate a simple JWT-like token
  private generateToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }))
    const signature = btoa('simple-signature-' + user.id + Date.now())
    
    return `${header}.${payload}.${signature}`
  }

  // Login with email/password (mock implementation)
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔐 Attempting login for:', email)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock validation - in real app, this would be an API call
    if (email && password.length >= 6) {
      const user: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email: email,
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      }
      
      const token = this.generateToken(user)
      
      this.state = {
        user,
        token,
        isAuthenticated: true
      }
      
      this.saveToStorage()
      this.notifyListeners()
      
      console.log('✅ Login successful:', user)
      return { success: true }
    } else {
      console.log('❌ Login failed: Invalid credentials')
      return { success: false, error: 'Credenziali non valide' }
    }
  }

  // Login with email link (simplified)
  async loginWithEmailLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log('✉️ Sending login link to:', email)
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo, automatically "verify" the email after 2 seconds
    setTimeout(() => {
      const user: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email: email,
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      }
      
      const token = this.generateToken(user)
      
      this.state = {
        user,
        token,
        isAuthenticated: true
      }
      
      this.saveToStorage()
      this.notifyListeners()
      
      console.log('✅ Email link verified, user logged in:', user)
    }, 2000)
    
    return { success: true }
  }

  // Logout
  logout() {
    console.log('🚪 Logging out user')
    this.state = {
      user: null,
      token: null,
      isAuthenticated: false
    }
    
    this.clearStorage()
    this.notifyListeners()
  }

  // Get current auth state
  getState(): AuthState {
    return { ...this.state }
  }

  // Subscribe to auth state changes
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of state change
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState())
      } catch (error) {
        console.error('Error in auth listener:', error)
      }
    })
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.isTokenValid(this.state.token)
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.isAuthenticated() ? this.state.user : null
  }
}

export const simpleAuth = SimpleAuth.getInstance()
export type { User, AuthState }