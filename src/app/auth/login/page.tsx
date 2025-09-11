'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Mail, ArrowLeft } from 'lucide-react'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'phone' | 'email'>('email')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for error messages from URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMessage('Errore durante l\'autenticazione. Riprova.')
    }
  }, [searchParams])

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          shouldCreateUser: true,
        }
      })

      if (error) {
        console.error('Auth error:', error)
        if (error.message.includes('Failed to fetch')) {
          setMessage('Servizio temporaneamente non disponibile. Per ora usa l\'accesso via email.')
        } else {
          setMessage(error.message)
        }
        setLoading(false)
      } else {
        // Redirect to verification page with phone number
        router.push(`/auth/verify?phone=${encodeURIComponent(phoneNumber)}`)
      }
    } catch (err) {
      console.error('Network error:', err)
      setMessage('Connessione non disponibile. Per ora usa l\'accesso via email.')
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Auth error:', error)
        if (error.message.includes('Failed to fetch')) {
          setMessage('Servizio temporaneamente non disponibile. Riprova più tardi.')
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage('Link di accesso inviato! Controlla la tua email.')
      }
    } catch (err) {
      console.error('Network error:', err)
      setMessage('Connessione non disponibile. Riprova più tardi.')
    }
    
    setLoading(false)
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
            <h1 className="login-title">Accedi a LocalSwap</h1>
            <p className="login-subtitle">
              Accedi per iniziare a scambiare nel tuo vicinato
            </p>
          </div>
          
          <div className="login-card-content">
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                onClick={() => setMode('phone')}
                className={`mode-btn ${mode === 'phone' ? 'mode-btn-active' : ''}`}
              >
                <Phone size={16} />
                Telefono
              </button>
              <button
                onClick={() => setMode('email')}
                className={`mode-btn ${mode === 'email' ? 'mode-btn-active' : ''}`}
              >
                <Mail size={16} />
                Email
              </button>
            </div>

            {/* Phone Login */}
            {mode === 'phone' && (
              <form onSubmit={handlePhoneLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Numero di telefono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="form-input"
                    required
                  />
                  <p className="form-hint">
                    Riceverai un SMS con il codice di accesso
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || !phoneNumber}
                  className={`submit-btn interactive ${phoneNumber ? 'submit-btn-ready' : ''}`}
                >
                  {loading ? 'Invio in corso...' : phoneNumber ? '📱 Invia codice SMS' : 'Inserisci numero di telefono'}
                </button>
              </form>
            )}

            {/* Email Login */}
            {mode === 'email' && (
              <form onSubmit={handleEmailLogin} className="login-form">
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
                  <p className="form-hint">
                    Riceverai un link magico per accedere
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || !email}
                  className={`submit-btn interactive ${email ? 'submit-btn-ready' : ''}`}
                >
                  {loading ? 'Invio in corso...' : email ? '✉️ Invia link di accesso' : 'Inserisci email'}
                </button>
              </form>
            )}

            {/* Message Display */}
            {message && (
              <div className={`message ${
                message.includes('inviato') ? 'message-success' : 'message-error'
              }`}>
                {message}
              </div>
            )}

            <div className="terms">
              Accedendo accetti i nostri{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-container">
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
    </div>}>
      <LoginForm />
    </Suspense>
  )
}