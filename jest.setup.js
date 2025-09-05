import '@testing-library/jest-dom'

// Polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock Next.js server environment
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map(Object.entries(init?.headers || {}))
  }
}

// Mock Next.js cache
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  },
  createServerSupabaseClient: jest.fn(),
}));

// Mock database operations
jest.mock('@/lib/database', () => {
  const mockSupabaseDatabase = jest.fn().mockImplementation(() => ({
     createUser: jest.fn(),
     findUserByEmail: jest.fn(),
     findUserById: jest.fn(),
     updateUser: jest.fn(),
     createPoll: jest.fn(),
     findPollById: jest.fn(),
     findPollsByUserId: jest.fn(),
     findAllActivePolls: jest.fn(),
     updatePoll: jest.fn(),
     deletePoll: jest.fn(),
     createVote: jest.fn(),
     findVoteByUserAndPoll: jest.fn(),
     findVotesByPollId: jest.fn(),
     getUserPollsCount: jest.fn(),
     getActivePollsCount: jest.fn(),
   }))

  return {
    SupabaseDatabase: mockSupabaseDatabase,
    database: {
      findPollsByUserId: jest.fn(),
  getUserPollsCount: jest.fn(),
  findAllActivePolls: jest.fn(),
  getActivePollsCount: jest.fn(),
  findPollById: jest.fn(),
  findVoteByUserAndPoll: jest.fn(),
  createVote: jest.fn(),
  createPoll: jest.fn(),
      users: {
        create: jest.fn(),
        findByEmail: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
      },
      polls: {
        create: jest.fn(),
        findById: jest.fn(),
        findByUserId: jest.fn(),
        findAllActive: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      votes: {
        create: jest.fn(),
        findByUserAndPoll: jest.fn(),
        findByPollId: jest.fn(),
      },
    },
  }
})

// Mock auth utilities
jest.mock('@/lib/auth', () => ({
  AuthClient: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getCurrentUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    isAuthenticated: jest.fn(),
  },
  AuthServer: {
    getCurrentUser: jest.fn(),
    getSession: jest.fn(),
    isAuthenticated: jest.fn(),
    getUserFromRequest: jest.fn(),
  },
  authValidation: {
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    validateName: jest.fn(),
  },
  getAuthErrorMessage: jest.fn(),
  requireAuth: jest.fn(),
  optionalAuth: jest.fn(),
}));

// Mock toast notifications
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})