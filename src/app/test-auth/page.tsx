'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  
  const supabase = createClient()
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }
  
  useEffect(() => {
    addLog('🔄 Starting simple auth test...')
    
    // Simple session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      addLog(`📋 Session check: ${session?.user?.email || 'No user'} | Error: ${error?.message || 'None'}`)
      setUser(session?.user || null)
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔔 Auth event: ${event} | User: ${session?.user?.email || 'None'}`)
      setUser(session?.user || null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  const handleLogin = async () => {
    addLog('🔑 Starting email login...')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/test-auth`
      }
    })
    
    if (error) {
      addLog(`❌ Login error: ${error.message}`)
    } else {
      addLog('✅ Login initiated - redirecting...')
    }
  }
  
  const handleLogout = async () => {
    addLog('🚪 Logging out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      addLog(`❌ Logout error: ${error.message}`)
    } else {
      addLog('✅ Logged out successfully')
      setUser(null)
    }
  }
  
  const clearStorage = () => {
    addLog('🧹 Clearing all storage...')
    localStorage.clear()
    sessionStorage.clear()
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    })
    addLog('✅ Storage cleared - refresh page to test')
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔧 Supabase Auth Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Status:</strong> {loading ? '⏳ Loading...' : (user ? `✅ Logged in as ${user.email}` : '❌ Not logged in')}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        {!user ? (
          <button onClick={handleLogin} style={{ marginRight: '10px', padding: '10px' }}>
            🔑 Login with Google
          </button>
        ) : (
          <button onClick={handleLogout} style={{ marginRight: '10px', padding: '10px' }}>
            🚪 Logout
          </button>
        )}
        
        <button onClick={clearStorage} style={{ padding: '10px' }}>
          🧹 Clear Storage
        </button>
        
        <button onClick={() => setLogs([])} style={{ marginLeft: '10px', padding: '10px' }}>
          🗑️ Clear Logs
        </button>
      </div>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', height: '400px', overflow: 'auto' }}>
        <h3>📝 Debug Logs:</h3>
        {logs.length === 0 ? (
          <p>No logs yet...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px', fontSize: '12px' }}>
              {log}
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue' }}>← Back to HomePage</a>
      </div>
    </div>
  )
}