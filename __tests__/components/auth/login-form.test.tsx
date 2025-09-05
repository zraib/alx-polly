import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { loginAction } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'

// Mock the loginAction
jest.mock('@/lib/actions/auth-actions', () => ({
  loginAction: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockLoginAction = loginAction as jest.MockedFunction<typeof loginAction>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  it('should render login form fields', () => {
    // Act
    render(<LoginForm />)

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ 
      success: false, 
      error: 'Please enter a valid email address' 
    })
    
    // Act
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const form = emailInput.closest('form')

    // Use fireEvent to bypass HTML5 validation
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    
    // Submit form directly
    await act(async () => {
      fireEvent.submit(form!)
    })

    // Assert - Check that the action was called and error is displayed
    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalled()
    })
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should show validation errors for empty fields', async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ success: false, error: 'Email is required' })
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act - Remove required attributes to bypass HTML5 validation
    emailInput.removeAttribute('required')
    passwordInput.removeAttribute('required')
    
    // Submit with empty fields
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('should submit form with valid credentials', async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ success: true, message: 'Login successful!' })
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalledWith(expect.any(FormData))
    })
    
    await waitFor(() => {
      expect(screen.getByText('Login successful!')).toBeInTheDocument()
    })
  })

  it('should handle login errors', async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ 
      success: false, 
      error: 'Invalid email or password' 
    })
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    // Arrange
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockLoginAction.mockReturnValue(promise as any)
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    expect(screen.getByText('Signing In...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Cleanup
    resolvePromise!({ success: true })
  })

  it('should clear errors on new form submission', async () => {
    // Arrange - First submission with invalid credentials
    mockLoginAction.mockResolvedValueOnce({ success: false, error: 'Invalid email or password' })
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act - First submission (should fail)
    await user.type(emailInput, 'invalid@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Assert - Error should be displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Act - Second submission with correct credentials
    mockLoginAction.mockResolvedValueOnce({ success: true, message: 'Login successful!' })
    await user.clear(emailInput)
    await user.clear(passwordInput)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert - Error should be cleared immediately when form is submitted
    // (component clears both error and message states at start of handleSubmit)
    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
    })
    
    // Success message should appear
     await waitFor(() => {
       expect(screen.getByText('Login successful!')).toBeInTheDocument()
     })
   })

  it('should handle network errors gracefully', async () => {
    // Arrange
    mockLoginAction.mockRejectedValue(new Error('Network error'))
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
    })
  })

  it('should have proper accessibility attributes', () => {
    // Act
    render(<LoginForm />)

    // Assert
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
  })

  it('should show success message after successful login', async () => {
    // Arrange
    mockLoginAction.mockResolvedValue({ success: true, message: 'Login successful!' })
    
    render(<LoginForm />)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Login successful!')).toBeInTheDocument()
    })
  })
})