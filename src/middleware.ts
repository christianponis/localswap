import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // This middleware will run on API routes and protected pages
    const supabase = await createClient()
    
    // Get the session from the request
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/add-item',
      '/messages',
      '/settings'
    ]
    
    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // If trying to access a protected route without being authenticated
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated and trying to access auth pages, redirect to home
    if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL('/', request.url))
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