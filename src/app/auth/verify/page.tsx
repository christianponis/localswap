'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Check } from 'lucide-react'
import { LocalSwapLogo } from '@/components/LocalSwapLogo'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone')
    if (phoneFromUrl) {
      setPhone(phoneFromUrl)
    }
  }, [searchParams])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !phone) return

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    } else {
      setMessage('Accesso effettuato con successo!')
      // Redirect to home after success
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  const resendCode = async () => {
    if (!phone) return
    
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: true,
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Nuovo codice inviato!')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <Link href="/auth/login" className="back-link">
            <ArrowLeft size={16} />
            Torna al login
          </Link>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <div className="login-logo">
              <LocalSwapLogo size={48} />
            </div>
            <h1 className="login-title">Verifica il tuo telefono</h1>
            <p className="login-subtitle">
              Inserisci il codice di 6 cifre che hai ricevuto via SMS
            </p>
            {phone && (
              <p className="phone-display">
                📱 {phone}
              </p>
            )}
          </div>
          
          <div className="login-card-content">
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="form-group">
                <label htmlFor="otp" className="form-label">
                  Codice di verifica
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="form-input otp-input"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
                <p className="form-hint">
                  Il codice scade dopo 10 minuti
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className={`submit-btn interactive ${otp.length === 6 ? 'submit-btn-ready' : ''}`}
              >
                {loading ? 'Verifica in corso...' : otp.length === 6 ? '✅ Verifica codice' : `Inserisci codice (${otp.length}/6)`}
                {!loading && otp.length === 6 && (
                  <Check size={16} style={{ marginLeft: '8px' }} />
                )}
              </button>
            </form>

            <div className="resend-section">
              <p className="resend-text">Non hai ricevuto il codice?</p>
              <button 
                onClick={resendCode}
                disabled={loading}
                className="resend-btn"
              >
                Invia di nuovo
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`message ${
                message.includes('successo') || message.includes('inviato') 
                  ? 'message-success' : 'message-error'
              }`}>
                {message}
              </div>
            )}

            <div className="terms">
              Problemi con la verifica?{' '}
              <Link href="/auth/login" className="terms-link">
                Prova con l&apos;email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
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
      <VerifyForm />
    </Suspense>
  )
}