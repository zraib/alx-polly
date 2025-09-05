import { NextRequest } from 'next/server'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

// Generate a secure CSRF token using Web Crypto API
export function generateCSRFToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API (available in Edge Runtime)
    const array = new Uint8Array(CSRF_TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback for Node.js environment
    const { randomBytes } = require('crypto')
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  }
}

// Create CSRF token hash for verification using Web Crypto API
export async function createCSRFHash(token: string, sessionId?: string): Promise<string> {
  const data = `${token}:${sessionId || 'anonymous'}:${CSRF_SECRET}`
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API (available in Edge Runtime)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = new Uint8Array(hashBuffer)
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
  } else {
    // Fallback for Node.js environment
    const { createHash } = require('crypto')
    return createHash('sha256').update(data).digest('hex')
  }
}

// Verify CSRF token
export async function verifyCSRFToken(token: string, hash: string, sessionId?: string): Promise<boolean> {
  if (!token || !hash) {
    return false
  }

  try {
    const expectedHash = await createCSRFHash(token, sessionId)
    return expectedHash === hash
  } catch (error) {
    console.error('CSRF token verification error:', error)
    return false
  }
}

// Extract CSRF token from request
export function extractCSRFToken(request: NextRequest): { token?: string; hash?: string } {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get('x-csrf-token')
  const headerHash = request.headers.get('x-csrf-hash')
  
  if (headerToken && headerHash) {
    return { token: headerToken, hash: headerHash }
  }

  // Check form data (for form submissions)
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/x-www-form-urlencoded') || 
      contentType?.includes('multipart/form-data')) {
    // For form data, we'll need to parse it in the calling function
    return {}
  }

  return {}
}

// Validate CSRF for form submissions
export async function validateCSRFFromForm(formData: FormData, sessionId?: string): Promise<boolean> {
  const token = formData.get('_csrf_token') as string
  const hash = formData.get('_csrf_hash') as string
  
  if (!token || !hash) {
    return false
  }

  return verifyCSRFToken(token, hash, sessionId)
}

// Validate CSRF for API requests
export async function validateCSRFFromHeaders(request: NextRequest, sessionId?: string): Promise<boolean> {
  const { token, hash } = extractCSRFToken(request)
  
  if (!token || !hash) {
    return false
  }

  return await verifyCSRFToken(token, hash, sessionId)
}

// Check if request needs CSRF protection
export function requiresCSRFProtection(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  const pathname = request.nextUrl.pathname

  // Only protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false
  }

  // Skip CSRF for API routes that use other authentication methods
  if (pathname.startsWith('/api/auth/callback')) {
    return false
  }

  // Skip for Supabase webhooks or external integrations
  if (pathname.startsWith('/api/webhooks/')) {
    return false
  }

  return true
}

// Generate CSRF token pair (token and hash)
export async function generateCSRFTokenPair(sessionId?: string): Promise<{ token: string; hash: string }> {
  const token = generateCSRFToken()
  const hash = await createCSRFHash(token, sessionId)
  return { token, hash }
}

// CSRF middleware function
export async function checkCSRFProtection(
  request: NextRequest,
  sessionId?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!requiresCSRFProtection(request)) {
    return { valid: true }
  }

  const contentType = request.headers.get('content-type') || ''
  
  // Handle form submissions
  if (contentType.includes('application/x-www-form-urlencoded') || 
      contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const isValid = await validateCSRFFromForm(formData, sessionId)
      
      if (!isValid) {
        return { 
          valid: false, 
          error: 'Invalid CSRF token. Please refresh the page and try again.' 
        }
      }
      
      return { valid: true }
    } catch (error) {
      console.error('CSRF validation error for form data:', error)
      return { 
        valid: false, 
        error: 'CSRF validation failed. Please try again.' 
      }
    }
  }

  // Handle JSON/API requests
  const isValid = await validateCSRFFromHeaders(request, sessionId)
  
  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid CSRF token. Please refresh the page and try again.' 
    }
  }

  return { valid: true }
}

// Helper to add CSRF headers to responses
export async function addCSRFHeaders(response: Response, sessionId?: string): Promise<Response> {
  const { token, hash } = await generateCSRFTokenPair(sessionId)
  
  response.headers.set('X-CSRF-Token', token)
  response.headers.set('X-CSRF-Hash', hash)
  
  return response
}

// Alias for backward compatibility
export const validateCSRFToken = verifyCSRFToken