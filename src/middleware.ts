import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Safe URL handler function
function safeUrl(url: string): string {
  // Ensure URLs start with / and handle any special characters
  return url.startsWith('/') ? url : `/${url}`;
}

// This middleware runs on every request to routes defined in the matcher
export async function middleware(req: NextRequest) {
  console.log('[Middleware] Running for:', req.nextUrl.pathname); // Log entry point

  try {
    // Check if this is a redirect (to prevent loops)
    const isRedirected = req.headers.get('x-middleware-rewrite') || 
                        req.headers.get('x-middleware-next') || 
                        req.nextUrl.searchParams.has('redirectedFrom');
    
    // If this is already a redirected request, just proceed
    if (isRedirected) {
      console.log('[Middleware] Already redirected, skipping.');
      return NextResponse.next();
    }
    
    const res = NextResponse.next()
    
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res })
    
    // Check if we have a session
    const {
      data: { session },
      error: sessionError, // Log potential errors during session fetch
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Middleware] Error getting session:', sessionError.message);
    }
    console.log('[Middleware] Session:', session ? 'Exists' : 'None');

    // URL being requested - make it safe
    const requestedUrl = req.nextUrl.pathname
    
    // Don't redirect if there's an ongoing auth callback or API route
    if (requestedUrl.includes('/auth/callback') || requestedUrl.includes('/api/')) {
      console.log('[Middleware] Skipping auth callback or API route:', requestedUrl);
      return res
    }

    // If no session and trying to access a protected route, redirect to login
    if (!session && requestedUrl.startsWith('/dashboard')) {
      console.log('[Middleware] No session, redirecting to login from:', requestedUrl);
      console.log('[Middleware] Request Origin:', req.nextUrl.origin); // Log the origin
      const loginUrl = new URL('/login', req.nextUrl.origin) // Construct new URL
      
      // *** Log the URL before redirecting ***
      console.log('[Middleware] Attempting redirect to (Login):', loginUrl.toString());

      const response = NextResponse.redirect(loginUrl.toString()) // Use string representation
      response.headers.set('x-middleware-rewrite', '1')
      return response
    }

    // If session exists and user is on login or signup page, redirect to dashboard
    // But only if not already in a redirect cycle and not handling auth
    if (session && 
        (requestedUrl.startsWith('/login') || requestedUrl.startsWith('/signup')) && 
        !req.nextUrl.search.includes('code=') && 
        !req.nextUrl.search.includes('error=')) {
      
      console.log('[Middleware] Session exists, redirecting to dashboard from:', requestedUrl);
      console.log('[Middleware] Request Origin:', req.nextUrl.origin); // Log the origin
      const dashboardUrl = new URL('/dashboard', req.nextUrl.origin) // Construct new URL
      
      // *** Log the URL before redirecting ***
      console.log('[Middleware] Attempting redirect to (Dashboard):', dashboardUrl.toString());

      const response = NextResponse.redirect(dashboardUrl.toString()) // Use string representation
      response.headers.set('x-middleware-rewrite', '1')
      return response
    }

    console.log('[Middleware] No redirect conditions met, proceeding.');
    return res
  } catch (error) {
    // Catch any URL or other errors and log them
    console.error('[Middleware] Error:', error instanceof Error ? error.message : error);
    // Log the problematic URL if possible
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
       console.error('[Middleware] Error likely related to URL:', req.nextUrl.toString());
    }
    // Return next response as fallback
    return NextResponse.next()
  }
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/auth/callback'
  ]
}
