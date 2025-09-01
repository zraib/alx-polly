import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client with SSR support
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side client for App Router (only use on server)
export async function createServerSupabaseClient() {
  // Dynamic import to avoid issues with client-side rendering
  if (typeof window !== 'undefined') {
    throw new Error('createServerSupabaseClient should only be used on the server side')
  }
  
  const { cookies } = await import('next/headers')
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value
          } catch (error) {
            console.error('Error getting cookie:', name, error)
            return undefined
          }
        },
        async set(name: string, value: string, options: any) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', name, error)
          }
        },
        async remove(name: string, options: any) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', name, error)
          }
        },
      },
    }
  )
}

// Middleware Supabase client
export const createMiddlewareSupabaseClient = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          options: string[]
          votes: number[]
          created_by: string
          is_active: boolean
          allow_multiple_selections: boolean
          require_login: boolean
          expiration_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          options: string[]
          votes?: number[]
          created_by: string
          is_active?: boolean
          allow_multiple_selections?: boolean
          require_login?: boolean
          expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          options?: string[]
          votes?: number[]
          created_by?: string
          is_active?: boolean
          allow_multiple_selections?: boolean
          require_login?: boolean
          expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string | null
          option_index: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id?: string | null
          option_index: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string | null
          option_index?: number
          created_at?: string
        }
      }
    }
  }
}