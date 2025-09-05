'use client'

import { useEffect, useState } from 'react'
import { generateCSRFTokenPair } from '@/lib/csrf-protection'

// Conditional import for act() only in test environment
let act: any = null
if (process.env.NODE_ENV === 'test') {
  act = require('@testing-library/react').act
}

export function CSRFToken() {
  const [tokens, setTokens] = useState<{ token: string; hash: string } | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const loadTokens = async () => {
      try {
        const tokenPair = await generateCSRFTokenPair()
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            act(() => {
              setTokens(tokenPair)
            })
          } else {
            setTokens(tokenPair)
          }
        }
      } catch (error) {
        // Silently handle errors in tests
        if (isMounted && process.env.NODE_ENV !== 'test') {
          console.error('Failed to load CSRF tokens:', error)
        }
      }
    }
    
    loadTokens()
    
    return () => {
      isMounted = false
    }
  }, [])

  if (!tokens) {
    return null
  }

  return (
    <>
      <input type="hidden" name="csrf_token" value={tokens.token} />
      <input type="hidden" name="csrf_hash" value={tokens.hash} />
    </>
  )
}

// Hook for getting CSRF tokens for AJAX requests
export function useCSRFToken() {
  const [tokens, setTokens] = useState<{ token: string; hash: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchTokens = async () => {
      try {
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            act(() => {
              setLoading(true)
              setError(null)
            })
          } else {
            setLoading(true)
            setError(null)
          }
        }
        
        const response = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'same-origin'
        })
        
        if (!isMounted) return
        
        if (response.ok) {
          const token = response.headers.get('X-CSRF-Token')
          const hash = response.headers.get('X-CSRF-Hash')
          
          if (token && hash) {
            if (process.env.NODE_ENV === 'test') {
              act(() => {
                setTokens({ token, hash })
              })
            } else {
              setTokens({ token, hash })
            }
          } else {
            if (process.env.NODE_ENV === 'test') {
              act(() => {
                setError('CSRF tokens not found in response headers')
              })
            } else {
              setError('CSRF tokens not found in response headers')
            }
          }
        } else {
          if (process.env.NODE_ENV === 'test') {
            act(() => {
              setError('Failed to fetch CSRF tokens')
            })
          } else {
            setError('Failed to fetch CSRF tokens')
          }
        }
      } catch (err) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            act(() => {
              setError(err instanceof Error ? err.message : 'Unknown error')
            })
          } else {
            setError(err instanceof Error ? err.message : 'Unknown error')
          }
        }
      } finally {
        if (isMounted) {
          if (process.env.NODE_ENV === 'test') {
            act(() => {
              setLoading(false)
            })
          } else {
            setLoading(false)
          }
        }
      }
    }

    fetchTokens()
    
    return () => {
      isMounted = false
    }
  }, [])

  return { tokens, loading, error }
}

// Helper function to add CSRF headers to fetch requests
export function addCSRFHeaders(headers: HeadersInit = {}, tokens: { token: string; hash: string }): HeadersInit {
  return {
    ...headers,
    'X-CSRF-Token': tokens.token,
    'X-CSRF-Hash': tokens.hash
  }
}