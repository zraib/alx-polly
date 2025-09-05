import { render, screen, fireEvent, waitFor, cleanup } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { CreatePollForm } from '@/components/polls/create-poll-form'
import { createPoll } from '@/lib/actions/poll-actions'
import { useToast } from '@/components/ui/use-toast'

const mockToast = jest.fn();

// Mock the createPoll action
jest.mock('@/lib/actions/poll-actions')
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

const mockCreatePoll = createPoll as jest.MockedFunction<typeof createPoll>

describe('CreatePollForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    mockToast.mockClear()
    mockCreatePoll.mockClear()
    cleanup() // Clean up any existing components
    user = userEvent.setup() // Create fresh user event setup
  })

  afterEach(() => {
    cleanup()
  })

  it('should render form fields correctly', () => {
    // Act
    render(<CreatePollForm />)

    // Assert
    expect(screen.getByLabelText(/poll title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add option/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create poll/i })).toBeInTheDocument()
  })

  it('should allow adding new options', async () => {
    // Act
    render(<CreatePollForm />)
    const addButton = screen.getByRole('button', { name: /add option/i })
    
    await user.click(addButton)

    // Assert
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument()
  })

  it('should allow removing options when more than 2 exist', async () => {
    // Act
    render(<CreatePollForm />)
    const addButton = screen.getByRole('button', { name: /add option/i })
    
    // Add a third option first
    await user.click(addButton)
    
    // Now remove buttons should be visible
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons).toHaveLength(3) // One for each option
    
    await user.click(removeButtons[0])

    // Assert
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument()
  })

  it('should not show remove buttons when only 2 options exist', () => {
    // Act
    render(<CreatePollForm />)

    // Assert
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('should limit maximum number of options', async () => {
    // Act
    render(<CreatePollForm />)
    const addButton = screen.getByRole('button', { name: /add option/i })
    
    // Add options up to the limit (assuming limit is 6, so add 4 more)
    for (let i = 0; i < 4; i++) {
      await user.click(addButton)
    }

    // Assert
    expect(addButton).toBeDisabled()
    expect(screen.getByPlaceholderText('Option 6')).toBeInTheDocument()
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      // Clear all mocks and DOM before each validation test
      cleanup();
      jest.clearAllMocks();
      document.body.innerHTML = '';
    });

    it('should validate title field', async () => {
      const user = userEvent.setup();
      render(<CreatePollForm />);
      
      const titleInput = screen.getByLabelText(/poll title/i);
      expect(titleInput).toHaveValue('');
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
      await user.type(optionInputs[0], 'Option 1');
      await user.type(optionInputs[1], 'Option 2');
      
      // Submit form without filling title
      const submitButton = screen.getByRole('button', { name: /create poll/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Validation Error',
          description: 'Poll title is required',
          variant: 'destructive'
        });
      }, { timeout: 3000 });
    });

    it('should validate option fields', async () => {
      const user = userEvent.setup();
      render(<CreatePollForm />);
      
      // Set valid title and ensure options are empty
      const titleInput = screen.getByLabelText(/poll title/i);
      await user.type(titleInput, 'Valid Title');
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i);
      expect(optionInputs[0]).toHaveValue('');
      expect(optionInputs[1]).toHaveValue('');
      
      // Submit form without filling options
      const submitButton = screen.getByRole('button', { name: /create poll/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Validation Error',
          description: 'At least 2 options are required',
          variant: 'destructive'
        });
      });
    });
  });

  it('should submit form with valid data', async () => {
    // Arrange
    mockCreatePoll.mockResolvedValue({ success: true, poll: null })
    
    render(<CreatePollForm />)
    const titleInput = screen.getByLabelText(/poll title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const option1Input = screen.getByPlaceholderText('Option 1')
    const option2Input = screen.getByPlaceholderText('Option 2')
    const submitButton = screen.getByRole('button', { name: /create poll/i })

    // Act
    await user.type(titleInput, 'Test Poll')
    await user.type(descriptionInput, 'Test Description')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Poll Created Successfully! 🎉',
        description: '"Test Poll" has been created and is now live for voting.',
      })
    })
  })

  it('should handle form submission errors', async () => {
    // Arrange
    const errorMessage = 'Failed to create poll'
    mockCreatePoll.mockResolvedValue({ 
      success: false, 
      error: errorMessage 
    })
    
    render(<CreatePollForm />)
    const titleInput = screen.getByLabelText(/poll title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const option1Input = screen.getByPlaceholderText('Option 1')
    const option2Input = screen.getByPlaceholderText('Option 2')
    const submitButton = screen.getByRole('button', { name: /create poll/i })

    // Act
    await user.type(titleInput, 'Test Poll')
    await user.type(descriptionInput, 'Test Description')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    
    // Find and submit the form
    const form = titleInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalled()
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }, { timeout: 3000 })
  })

  it('should call createPoll when form is submitted', async () => {
    // Arrange
    mockCreatePoll.mockResolvedValue({ success: true, poll: null })
    
    render(<CreatePollForm />)
    const titleInput = screen.getByLabelText(/poll title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const option1Input = screen.getByPlaceholderText('Option 1')
    const option2Input = screen.getByPlaceholderText('Option 2')
    const submitButton = screen.getByRole('button', { name: /create poll/i })

    // Act
    await user.type(titleInput, 'Test Poll')
    await user.type(descriptionInput, 'Test Description')
    await user.type(option1Input, 'Option A')
    await user.type(option2Input, 'Option B')
    
    // Find and submit the form
    const form = titleInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      await user.click(submitButton)
    }

    // Assert
    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should reset form after successful submission', async () => {
    // Arrange
    mockCreatePoll.mockResolvedValue({ success: true, poll: null })
    
    render(<CreatePollForm />)
    const titleInput = screen.getByLabelText(/poll title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const option1Input = screen.getByPlaceholderText('Option 1')
    const option2Input = screen.getByPlaceholderText('Option 2')
    const submitButton = screen.getByRole('button', { name: /create poll/i })

    // Act
    await user.type(titleInput, 'Test Poll')
    await user.type(descriptionInput, 'Test Description')
    await user.type(option1Input, 'Option 1')
    await user.type(option2Input, 'Option 2')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(titleInput).toHaveValue('')
      expect(descriptionInput).toHaveValue('')
      expect(option1Input).toHaveValue('')
      expect(option2Input).toHaveValue('')
    })
  })
})