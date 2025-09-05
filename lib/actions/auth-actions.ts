import { AuthClient } from '@/lib/auth'
import { loginSchema, registerSchema } from '@/lib/validations'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  try {
    // Extract form data
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input using Zod schema
    const validationResult = loginSchema.safeParse({
      email,
      password
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { success: false, error: firstError.message }
    }

    const validatedData = validationResult.data

    // Attempt to sign in
    try {
      const result = await AuthClient.signIn({
        email: validatedData.email,
        password: validatedData.password
      })

      if (!result.user) {
        return { success: false, error: 'Invalid email or password' }
      }

      return { success: true, message: 'Login successful!' }
    } catch (authError: any) {
      console.error('Authentication error:', authError)
      
      // Handle specific Supabase auth errors
      if (authError?.message?.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' }
      }
      
      if (authError?.message?.includes('Email not confirmed')) {
        return { success: false, error: 'Please check your email and confirm your account before signing in' }
      }
      
      if (authError?.message?.includes('Too many requests')) {
        return { success: false, error: 'Too many login attempts. Please try again later' }
      }
      
      return { success: false, error: 'Unable to sign in at this time. Please try again later.' }
    }
  } catch (error) {
    console.error('Error in loginAction:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function registerAction(formData: FormData) {
  try {
    // Extract form data
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validate input using Zod schema
    const validationResult = registerSchema.safeParse({
      email,
      password,
      confirmPassword
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { success: false, error: firstError.message }
    }

    const validatedData = validationResult.data

    // Attempt to sign up
    try {
      const result = await AuthClient.signUp({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.email.split('@')[0] // Use email prefix as default name
      })

      if (!result.user) {
        return { success: false, error: 'Failed to create account. Please try again.' }
      }

      // Check if email confirmation is required
      if (!result.session) {
        return { 
          success: true, 
          message: 'Account created successfully! Please check your email to confirm your account before signing in.',
          requiresConfirmation: true
        }
      }

      return { success: true, message: 'Account created and logged in successfully!' }
    } catch (authError: any) {
      console.error('Registration error:', authError)
      
      // Handle specific Supabase auth errors
      if (authError?.message?.includes('User already registered')) {
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' }
      }
      
      if (authError?.message?.includes('Password should be at least')) {
        return { success: false, error: 'Password must be at least 6 characters long' }
      }
      
      if (authError?.message?.includes('Unable to validate email')) {
        return { success: false, error: 'Please enter a valid email address' }
      }
      
      if (authError?.message?.includes('Signup is disabled')) {
        return { success: false, error: 'Account registration is currently disabled. Please contact support.' }
      }
      
      return { success: false, error: 'Unable to create account at this time. Please try again later.' }
    }
  } catch (error) {
    console.error('Error in registerAction:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function logoutAction() {
  try {
    await AuthClient.signOut()
    redirect('/auth/login')
  } catch (error) {
    console.error('Error in logoutAction:', error)
    return { success: false, error: 'Unable to sign out at this time. Please try again.' }
  }
}