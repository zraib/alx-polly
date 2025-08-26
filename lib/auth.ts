import { NextRequest } from "next/server";
import { createServerSupabaseClient, supabase } from './supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { database } from './database'

// Types for authentication
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Client-side auth utilities
export class AuthClient {
  // Sign up new user
  static async signUp({ email, password, name }: RegisterData) {
    try {
      // Create auth user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (authError) throw authError

      // If user is created, also create user record in our database
      if (authData.user) {
        try {
          await database.users.create({
            email: authData.user.email!,
            name,
          })
        } catch (dbError) {
          console.error('Failed to create user record in database:', dbError)
          // Don't throw here as auth user is already created
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign in existing user
  static async signIn({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        // Only log error if it's not a session missing error
        if (error.message !== 'Auth session missing!') {
          console.error('Get current user error:', error)
        }
        return null
      }
      if (!user) return null

      // Get additional user data from our database
      const userData = await database.users.findByEmail(user.email!)
      
      return {
        id: user.id,
        email: user.email!,
        name: userData?.name || user.user_metadata?.name || '',
        createdAt: userData?.created_at || user.created_at,
        updatedAt: userData?.updated_at || user.updated_at,
      } as User
    } catch (error) {
      // Only log error if it's not a session missing error
      if (error instanceof Error && error.message !== 'Auth session missing!') {
        console.error('Get current user error:', error)
      }
      return null
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return !!session
  }
}

// Server-side auth utilities
export class AuthServer {
  // Get current user from server
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) return null

      // Get additional user data from our database
      const userData = await database.users.findByEmail(user.email!)
      
      return {
        id: user.id,
        email: user.email!,
        name: userData?.name || user.user_metadata?.name || '',
        createdAt: userData?.created_at || user.created_at,
        updatedAt: userData?.updated_at || user.updated_at,
      } as User
    } catch (error) {
      console.error('Server get current user error:', error)
      return null
    }
  }

  // Get current session from server
  static async getSession() {
    try {
      const supabase = createServerSupabaseClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Server get session error:', error)
      return null
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return !!session
  }

  // Extract user from request (for middleware)
  static async getUserFromRequest(request: NextRequest): Promise<User | null> {
    try {
      // This would be used in middleware with createMiddlewareSupabaseClient
      // For now, we'll use the server client approach
      return await this.getCurrentUser()
    } catch (error) {
      console.error('Get user from request error:', error)
      return null
    }
  }


}

// Auth validation helpers
export const authValidation = {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  validateName(name: string): boolean {
    return name.trim().length >= 2
  },
}

// Auth error handling
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred'
  
  const message = error.message || error.error_description || error.toString()
  
  // Common Supabase auth error messages
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password'
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists'
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link'
  }
  
  if (message.includes('Password should be at least 6 characters')) {
    return 'Password must be at least 6 characters long'
  }
  
  return message
}

// Route protection helpers
export const requireAuth = async (): Promise<User> => {
  const user = await AuthServer.getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const optionalAuth = async (): Promise<User | null> => {
  return await AuthServer.getCurrentUser()
}