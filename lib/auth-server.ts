import { NextRequest } from 'next/server'

// Types
export interface RegisterData {
  name: string
  email: string
  password: string
}

// Server-side authentication utilities
export class AuthServer {
  // Hash password using bcrypt (server-side only)
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt')
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Compare password with hash (server-side only)
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt')
    return await bcrypt.compare(password, hash)
  }

  // Generate JWT tokens (server-side only)
  static generateTokens(user: any): { accessToken: string; refreshToken: string; expiresIn: number } {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const expiresIn = 24 * 60 * 60 // 24 hours in seconds
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '24h' }
    )
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      secret,
      { expiresIn: '7d' }
    )
    
    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }

  // Extract token from request headers
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  // Verify JWT token (server-side only)
  static async verifyToken(token: string): Promise<any> {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    
    try {
      const decoded = jwt.verify(token, secret)
      return decoded
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
}