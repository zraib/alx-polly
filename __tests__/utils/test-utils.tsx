import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Poll } from '@/types'

// Mock data for testing
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockPoll: Poll = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Test Poll',
  description: 'This is a test poll',
  options: ['Option 1', 'Option 2', 'Option 3'],
  votes: [5, 3, 2],
  created_by: mockUser.id,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_active: true,
  allow_multiple_selections: false,
  require_login: false,
  expiration_date: undefined,
}

export const mockPolls: Poll[] = [
  mockPoll,
  {
    ...mockPoll,
    id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Second Test Poll',
    description: 'Another test poll',
    votes: [10, 8, 5],
    expiration_date: undefined,
  },
  {
    ...mockPoll,
    id: '123e4567-e89b-12d3-a456-426614174003',
    title: 'Inactive Poll',
    description: 'This poll is inactive',
    is_active: false,
    votes: [2, 1, 0],
    expiration_date: undefined,
  },
]

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const createMockFormData = (data: Record<string, string>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock action functions - exported for use in individual tests
export const mockLoginUser = jest.fn()
export const mockRegisterUser = jest.fn()
export const mockLogoutUser = jest.fn()
export const mockCreatePoll = jest.fn()
export const mockVoteOnPoll = jest.fn()
export const mockGetAllActivePolls = jest.fn()
export const mockGetUserPolls = jest.fn()

// Note: Individual test files should handle their own mocks to avoid conflicts
// These global mocks are removed to prevent interference between test suites

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}))

// Note: CSRF token mocks are handled in individual test files to avoid conflicts

// Mock CSRF protection validation
jest.mock('@/lib/csrf-protection', () => ({
  validateCSRFToken: jest.fn(() => Promise.resolve(true)),
  generateCSRFTokenPair: jest.fn(() => Promise.resolve({
    token: 'test-csrf-token',
    hash: 'test-csrf-hash'
  })),
  extractCSRFFromRequest: jest.fn(() => ({
    token: 'test-csrf-token',
    hash: 'test-csrf-hash'
  })),
  validateCSRFForRequest: jest.fn(() => Promise.resolve(true)),
  requiresCSRFProtection: jest.fn(() => true),
  addCSRFHeaders: jest.fn((response) => Promise.resolve(response))
}))

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true, remaining: 10 })),
  identifyClient: jest.fn(() => 'test-client-id'),
  getRateLimitConfig: jest.fn(() => ({ windowMs: 60000, maxRequests: 100 }))
}))