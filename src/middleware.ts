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
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Middleware] Error getting session:', sessionError.message);
    }
    console.log('[Middleware] Session:', session ? 'Exists' : 'None');

    const requestedUrl = req.nextUrl.pathname

    // Allow requests for API, static files, images, auth callback
    if (requestedUrl.startsWith('/api') || 
        requestedUrl.startsWith('/_next/static') || 
        requestedUrl.startsWith('/_next/image') || 
        requestedUrl.includes('/auth/callback') ||
        requestedUrl === '/favicon.ico') {
      console.log('[Middleware] Skipping asset/API/auth route:', requestedUrl);
      return res;
    }

    // If no session and trying to access a protected route (e.g., dashboard)
    if (!session && requestedUrl.startsWith('/dashboard')) {
      console.log('[Middleware] No session, rewriting to login from:', requestedUrl);
      const loginUrl = new URL('/login', req.url); // Use req.url as base for rewrite target
      console.log('[Middleware] Rewriting to:', loginUrl.toString());
      return NextResponse.rewrite(loginUrl); // Rewrite instead of redirect
    }

    // If session exists and user is on login or signup page, redirect to dashboard
    if (session && (requestedUrl.startsWith('/login') || requestedUrl.startsWith('/signup'))) {
      console.log('[Middleware] Session exists, redirecting to dashboard from:', requestedUrl);
      const dashboardUrl = new URL('/dashboard', req.nextUrl.origin); // Keep redirect for this case for now
      console.log('[Middleware] Attempting redirect to (Dashboard):', dashboardUrl.toString());
      // Still using manual string construction for redirect as it was the last working attempt for redirects
      const response = NextResponse.redirect(dashboardUrl.toString()) 
      return response
    }

    console.log('[Middleware] No redirect/rewrite conditions met, proceeding.');
    return res
  } catch (error) {
    console.error('[Middleware] Error:', error instanceof Error ? error.message : error);
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
       console.error('[Middleware] Error likely related to URL handling during redirect/rewrite:', req.nextUrl.toString());
    }
    // Fallback to allow request processing if middleware errors
    return NextResponse.next()
  }
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Matcher adjusted to exclude these explicitly, complementing the logic inside.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
