import { createPoll, submitVoteAction, getAllActivePolls, getUserPolls } from '@/lib/actions/poll-actions'
import { database } from '@/lib/database'
import { AuthServer } from '@/lib/auth'
import { Poll } from '@/types'
import { mockUser, mockPoll, mockPolls } from '../../utils/test-utils'

// Mock the database and auth modules
jest.mock('@/lib/database')
jest.mock('@/lib/auth')

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

// Mock CSRF validation
jest.mock('@/lib/csrf-protection', () => ({
  validateCSRFFromForm: jest.fn().mockResolvedValue(true),
  verifyCSRFToken: jest.fn().mockResolvedValue(true),
  validateCSRFToken: jest.fn().mockResolvedValue(true)
}))

const mockDatabase = database as jest.Mocked<typeof database>
const mockAuthServer = AuthServer as jest.Mocked<typeof AuthServer>

describe('Poll Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup database mocks
    mockDatabase.polls = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAllActive: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any
    
    mockDatabase.votes = {
      create: jest.fn(),
      findByUserAndPoll: jest.fn(),
      findByPollId: jest.fn()
    } as any
    
    // Setup auth mocks
    ;(AuthServer.getCurrentUser as jest.Mock) = jest.fn()
  })

  describe('createPoll', () => {
    it('should create a poll successfully', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('title', 'Test Poll');
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));
      formData.append('settings', JSON.stringify({ requireLogin: false, allowMultipleSelections: false }));
      formData.append('csrf_token', 'mock-token');
      formData.append('csrf_hash', 'mock-hash');
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockDatabase.polls.create as jest.Mock).mockResolvedValue(mockPoll)

      // Act
      const result = await createPoll(formData)

      // Assert
      expect(mockDatabase.polls.create).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.poll).toEqual(mockPoll)
    })

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('title', 'Test Poll');
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await createPoll(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Please log in to create a poll')
    })

    it('should return error when title is missing', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('title', '')  // Empty title to trigger validation error
      formData.append('description', 'Test Description');
      formData.append('options', JSON.stringify(['Option 1', 'Option 2']));
      formData.append('settings', JSON.stringify({ requireLogin: false, allowMultipleSelections: false }));
      formData.append('csrf_token', 'mock-token');
      formData.append('csrf_hash', 'mock-hash');
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)

      // Act
      const result = await createPoll(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Poll title is required')
    })
  })

  describe('submitVoteAction', () => {
    it('should vote on poll successfully', async () => {
      // Arrange
      const pollId = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID
      const optionIndex = 0;
      const updatedPoll = { ...mockPoll, votes: [6, 3, 2] };
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockDatabase.votes.findByUserAndPoll as jest.Mock).mockResolvedValue(null)
      ;(mockDatabase.polls.findById as jest.Mock).mockResolvedValue(mockPoll as any)
      ;(mockDatabase.votes.create as jest.Mock).mockResolvedValue({ id: '1', poll_id: pollId, user_id: mockUser.id, option_index: optionIndex, created_at: new Date().toISOString() })
      ;(mockDatabase.polls.findById as jest.Mock).mockResolvedValueOnce(updatedPoll as any)

      // Act
      const formData = new FormData()
      formData.append('pollId', pollId)
      formData.append('optionIndex', optionIndex.toString())
      formData.append('csrf_token', 'mock-token')
      formData.append('csrf_hash', 'mock-hash')
      const result = await submitVoteAction(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(mockDatabase.votes.create).toHaveBeenCalledWith({
        pollId: pollId,
        userId: mockUser.id,
        optionIndex: optionIndex
      })
    })

    it('should return error when user already voted', async () => {
      // Arrange
      const pollId = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID
      const optionIndex = 0;
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockDatabase.polls.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(mockDatabase.votes.findByUserAndPoll as jest.Mock).mockResolvedValue({ id: '1', poll_id: pollId, user_id: mockUser.id, option_index: 0, created_at: new Date().toISOString() })

      // Act
      const formData = new FormData()
      formData.append('pollId', pollId)
      formData.append('optionIndex', optionIndex.toString())
      formData.append('csrf_token', 'mock-token')
      formData.append('csrf_hash', 'mock-hash')
      const result = await submitVoteAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('You have already voted on this poll. Multiple votes are not allowed.')
    })

    it('should return error when poll is not found', async () => {
      // Arrange
      const pollId = 'non-existent-poll'
      const optionIndex = 0;
      
      (AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockDatabase.votes.findByUserAndPoll as jest.Mock).mockResolvedValue(null)
      ;(mockDatabase.polls.findById as jest.Mock).mockResolvedValue(null)

      // Act
      const formData = new FormData()
      formData.append('pollId', pollId)
      formData.append('optionIndex', optionIndex.toString())
      formData.append('csrf_token', 'mock-token')
      formData.append('csrf_hash', 'mock-hash')
      const result = await submitVoteAction(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid poll ID format')
    })
  })

  describe('getAllActivePolls', () => {
    it('should fetch active polls successfully', async () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const activePolls = mockPolls.filter(poll => poll.is_active)
      
      ;(mockDatabase.polls.findAllActive as jest.Mock).mockResolvedValue(activePolls)

      // Act
      const result = await getAllActivePolls(page, pageSize)

      // Assert
      expect(result.success).toBe(true)
      expect(result.polls).toEqual(activePolls)
      expect(result.pagination?.currentPage).toBe(page)
      expect(result.pagination?.limit).toBe(pageSize)
    })

    it('should handle database errors', async () => {
      // Arrange
      const page = 1
      const pageSize = 10
      
      ;(mockDatabase.polls.findAllActive as jest.Mock).mockRejectedValue(new Error('Database error'))

      // Act
      const result = await getAllActivePolls(page, pageSize)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch polls')
      expect(result.polls).toEqual([])
     })
  })

  describe('getUserPolls', () => {
    it('should fetch user polls successfully', async () => {
      // Arrange
      const page = 1
      const pageSize = 10
      const userPolls = mockPolls.filter(poll => poll.created_by === mockUser.id) as Poll[]
      
      ;(AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(mockDatabase.polls.findByUserId as jest.Mock).mockResolvedValue(userPolls)

      // Act
      const result = await getUserPolls(page, pageSize)

      // Assert mock calls first
      expect(mockDatabase.polls.findByUserId).toHaveBeenCalledWith(mockUser.id)
      
      // Assert result
      expect(result.success).toBe(true)
      expect(result.polls).toEqual(userPolls)
      expect(result.pagination?.currentPage).toBe(page)
    })

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const page = 1
      const pageSize = 10
      
      ;(AuthServer.getCurrentUser as jest.Mock).mockResolvedValue(null)

      // Act
      const result = await getUserPolls(page, pageSize)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })
  })
})