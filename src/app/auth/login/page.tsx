'use client'

import { useState } from 'react'
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FirebaseLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  
  const { user, loading, login, register, resetPassword } = useFirebaseAuth()
  const router = useRouter()

  // Redirect if already logged in
  if (user && !loading) {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setMessage('')
    
    const result = isRegister 
      ? await register(email, password, email.split('@')[0])
      : await login(email, password)
    
    if (result.success) {
      setMessage(isRegister ? 'Account creato con successo!' : 'Login effettuato!')
      // Firebase will automatically redirect via the auth state change
    } else {
      setMessage(result.error || 'Errore durante l\'autenticazione')
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage('Inserisci la tua email per recuperare la password')
      return
    }
    
    const result = await resetPassword(email)
    if (result.success) {
      setMessage('Email di recupero inviata! Controlla la tua posta.')
    } else {
      setMessage(result.error || 'Errore durante l\'invio dell\'email')
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-logo">
                <LocalSwapLogo size={48} />
              </div>
              <h1 className="login-title">Caricamento...</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} />
            Torna alla home
          </Link>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <div className="login-logo">
              <LocalSwapLogo size={48} />
            </div>
            <h1 className="login-title">
              {isRegister ? 'Registrati su LocalSwap' : 'Accedi a LocalSwap'}
            </h1>
            <p className="login-subtitle">
              {isRegister 
                ? 'Crea il tuo account per iniziare a scambiare' 
                : 'Accedi per iniziare a scambiare nel tuo vicinato'
              }
            </p>
          </div>
          
          <div className="login-card-content">
            {/* Toggle Login/Register */}
            <div className="mode-toggle">
              <button
                onClick={() => setIsRegister(false)}
                className={`mode-btn ${!isRegister ? 'mode-btn-active' : ''}`}
              >
                <Mail size={16} />
                Accedi
              </button>
              <button
                onClick={() => setIsRegister(true)}
                className={`mode-btn ${isRegister ? 'mode-btn-active' : ''}`}
              >
                <Lock size={16} />
                Registrati
              </button>
            </div>

            {/* Login/Register Form */}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Indirizzo email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tuo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegister ? 'Crea una password (min 6 caratteri)' : 'La tua password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingRight: '3rem' }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || !email || !password}
                className={`submit-btn ${email && password ? 'submit-btn-ready' : ''}`}
              >
                {loading ? 'Attendere...' : isRegister ? '🚀 Crea Account' : '🔐 Accedi'}
              </button>
            </form>

            {/* Password Reset */}
            {!isRegister && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button
                  onClick={handlePasswordReset}
                  className="terms-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`message ${
                message.includes('successo') || message.includes('inviata') ? 'message-success' : 'message-error'
              }`}>
                {message}
              </div>
            )}

            <div className="terms">
              {isRegister ? 'Registrandoti' : 'Accedendo'} accetti i nostri{' '}
              <a href="#" className="terms-link">
                Termini di Servizio
              </a>{' '}
              e la{' '}
              <a href="#" className="terms-link">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}