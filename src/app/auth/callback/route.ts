import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔄 Auth callback triggered:', { code: !!code, next, origin })

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔄 Code exchange result:', { 
      error: error?.message, 
      hasUser: !!data.user,
      userEmail: data.user?.email 
    })
    
    if (!error && data.user) {
      console.log('✅ Auth successful, redirecting to:', `${origin}${next}`)
      // Add a query parameter to indicate successful auth
      const redirectUrl = `${origin}${next}${next.includes('?') ? '&' : '?'}auth=success`
      return NextResponse.redirect(redirectUrl)
    } else {
      console.log('❌ Auth exchange failed:', error?.message)
    }
  } else {
    console.log('❌ No auth code provided')
  }

  // If there's an error, redirect to login with error message
  console.log('🔄 Redirecting to login with error')
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}