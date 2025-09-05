import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from './lib/supabase'
import { checkGeneralRateLimit, checkAuthRateLimit, checkPollCreationRateLimit, checkVoteRateLimit } from './lib/rate-limiter'
import { checkCSRFProtection, addCSRFHeaders } from './lib/csrf-protection'

export async function middleware(req: NextRequest) {
  const { supabase, response } = await createMiddlewareSupabaseClient(req)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user ID for rate limiting if available
  const userId = session?.user?.id
  const userIdentifier = userId ? `user:${userId}` : undefined

  // Apply rate limiting based on route
  let rateLimitResult
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/auth/')) {
    rateLimitResult = checkAuthRateLimit(req, userIdentifier)
  } else if (pathname.includes('/polls/create') || pathname.includes('/api/polls') && req.method === 'POST') {
    rateLimitResult = checkPollCreationRateLimit(req, userIdentifier)
  } else if (pathname.includes('/vote') || (pathname.includes('/api/votes') && req.method === 'POST')) {
    rateLimitResult = checkVoteRateLimit(req, userIdentifier)
  } else {
    rateLimitResult = checkGeneralRateLimit(req, userIdentifier)
  }

  // Check if rate limit exceeded
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ 
        error: rateLimitResult.message,
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    )
  }

  // Apply CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfResult = await checkCSRFProtection(req, session?.user?.id)
    
    if (!csrfResult.valid) {
      return new NextResponse(
        JSON.stringify({ error: csrfResult.error }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }

  // Authentication redirects
  // If user is not signed in and the current path is not /auth/login or /auth/register
  // redirect the user to /auth/login
  if (!session && !req.nextUrl.pathname.startsWith('/auth') && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/polls')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If user is signed in and the current path is /auth/login or /auth/register
  // redirect the user to /
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Add CSRF tokens to response headers for client-side use
  const enhancedResponse = await addCSRFHeaders(response, session?.user?.id)
  
  // Add rate limit headers
  enhancedResponse.headers.set('X-RateLimit-Limit', '100')
  enhancedResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  enhancedResponse.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())

  return enhancedResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}