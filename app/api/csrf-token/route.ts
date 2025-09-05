import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFTokenPair } from '@/lib/csrf-protection'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user session for CSRF token generation
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // Generate CSRF token pair
    const { token, hash } = await generateCSRFTokenPair(session?.user?.id)
    
    // Return empty response with CSRF tokens in headers
    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'X-CSRF-Hash': hash,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    return response
  } catch (error) {
    console.error('Error generating CSRF tokens:', error)
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate CSRF tokens' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}