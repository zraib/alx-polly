import { loginAction, registerAction, logoutAction } from '@/lib/actions/auth-actions'
import { supabase } from '@/lib/supabase'
import { mockUser } from '../../utils/test-utils'

// Mock the supabase client
jest.mock('@/lib/supabase')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

// Mock AuthClient
jest.mock('@/lib/auth', () => ({
  AuthClient: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const { redirect } = require('next/navigation')
const { AuthClient } = require('@/lib/auth')

// Type the mocked AuthClient methods
const mockAuthClient = AuthClient as jest.Mocked<typeof AuthClient>

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loginAction', () => {
    it('should login user successfully', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      
      mockAuthClient.signIn.mockResolvedValue({
        user: mockUser,
        session: {}
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(mockAuthClient.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should return error when email is missing', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('password', 'password123')
      // Missing email

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid input: expected string, received null')
    })

    it('should return error when password is missing', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      // Missing password

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid input: expected string, received null')
    })

    it('should handle authentication errors', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')
      
      mockAuthClient.signIn.mockResolvedValue({
        user: null,
        session: null
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should handle invalid email format', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', 'password123')

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Please enter a valid email address')
    })
  })

  describe('registerAction', () => {
    it('should register user successfully', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'Password123')
      formData.append('confirmPassword', 'Password123')
      
      mockAuthClient.signUp.mockResolvedValue({
        user: mockUser,
        session: {}
      })

      // Act
      const result = await registerAction(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(mockAuthClient.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Password123',
        name: 'newuser'
      })
    })

    it('should return error when passwords do not match', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'Password123')
      formData.append('confirmPassword', 'DifferentPassword123')

      // Act
      const result = await registerAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Passwords do not match')
    })

    it('should return error when password is too short', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', '123')
      formData.append('confirmPassword', '123')

      // Act
      const result = await registerAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Password must be at least 6 characters long')
    })

    it('should handle registration errors', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'Password123')
      formData.append('confirmPassword', 'Password123')
      
      mockAuthClient.signUp.mockResolvedValue({
        user: null,
        session: null
      })

      // Act
      const result = await registerAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create account. Please try again.')
    })

    it('should return error when required fields are missing', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      // Missing password and confirmPassword

      // Act
      const result = await registerAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid input: expected string, received null')
    })
  })

  describe('logoutAction', () => {
    it('should logout user successfully', async () => {
      // Arrange
      mockAuthClient.signOut.mockResolvedValue({})

      // Act
      await logoutAction()

      // Assert
      expect(mockAuthClient.signOut).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith('/auth/login')
    })

    it('should handle logout errors', async () => {
      // Arrange
      mockAuthClient.signOut.mockRejectedValue(new Error('Logout failed'))

      // Act
      const result = await logoutAction()

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Unable to sign out at this time. Please try again.'
      })
      expect(redirect).not.toHaveBeenCalled()
    })
  })
})