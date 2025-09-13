import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // TEMPORARY: Disable middleware protection for add-item since we're using Firebase Auth
    // The add-item page has its own client-side authentication protection
    
    // Protected routes that require authentication (excluding add-item for now)
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/settings'
    ]
    
    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // For protected routes (not add-item), check Supabase auth
    if (isProtectedRoute) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return NextResponse.next()
  } catch (e) {
    // If there's an error with authentication, allow the request to continue
    // This prevents the app from breaking if Supabase is down
    return NextResponse.next()
  }
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files (public folder)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}