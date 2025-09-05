import { NextRequest } from 'next/server'

// Simple in-memory rate limiter for development
// In production, use Redis or a proper rate limiting service
interface RateLimitEntry {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      this.store.set(key, newEntry)
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: newEntry.resetTime
      }
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment count
    entry.count++
    this.store.set(key, entry)
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    }
  }

  cleanup() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter()

// Rate limiting configurations
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    limit: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  // Poll creation
  CREATE_POLL: {
    limit: 10, // 10 polls
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many polls created. Please try again in 1 hour.'
  },
  // Voting
  VOTE: {
    limit: 50, // 50 votes
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many votes submitted. Please try again in 1 hour.'
  },
  // General API
  GENERAL: {
    limit: 100, // 100 requests
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please try again later.'
  }
}

// Get client identifier for rate limiting
export function getClientId(request: NextRequest): string {
  // Try to get user ID from session if available
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

// Rate limiting middleware function
export function checkRateLimit(
  request: NextRequest,
  config: { limit: number; windowMs: number; message: string },
  identifier?: string
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const clientId = identifier || getClientId(request)
  const key = `${request.nextUrl.pathname}:${clientId}`
  
  const result = rateLimiter.check(key, config.limit, config.windowMs)
  
  return {
    ...result,
    message: result.allowed ? undefined : config.message
  }
}

// Specific rate limiting functions
export function checkAuthRateLimit(request: NextRequest, identifier?: string) {
  return checkRateLimit(request, RATE_LIMITS.AUTH, identifier)
}

export function checkPollCreationRateLimit(request: NextRequest, identifier?: string) {
  return checkRateLimit(request, RATE_LIMITS.CREATE_POLL, identifier)
}

export function checkVoteRateLimit(request: NextRequest, identifier?: string) {
  return checkRateLimit(request, RATE_LIMITS.VOTE, identifier)
}

export function checkGeneralRateLimit(request: NextRequest, identifier?: string) {
  return checkRateLimit(request, RATE_LIMITS.GENERAL, identifier)
}

// Cleanup function for graceful shutdown
export function cleanupRateLimiter() {
  rateLimiter.cleanup()
}