import { render, screen } from '../../utils/test-utils'
import { PollCard } from '@/components/polls/poll-card'
import { mockPoll } from '../../utils/test-utils'

describe('PollCard', () => {
  it('should render poll information correctly', () => {
    // Act
    render(<PollCard poll={mockPoll} />)

    // Assert
    expect(screen.getByText(mockPoll.title)).toBeInTheDocument()
    expect(screen.getByText(mockPoll.description)).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('10 votes')).toBeInTheDocument() // Total votes: 5+3+2=10
  })

  it('should display inactive status for inactive polls', () => {
    // Arrange
    const inactivePoll = { ...mockPoll, is_active: false }

    // Act
    render(<PollCard poll={inactivePoll} />)

    // Assert
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should show correct vote count', () => {
    // Arrange
    const pollWithDifferentVotes = {
      ...mockPoll,
      votes: [15, 10, 5], // Total: 30 votes
    }

    // Act
    render(<PollCard poll={pollWithDifferentVotes} />)

    // Assert
    expect(screen.getByText('30 votes')).toBeInTheDocument()
  })

  it('should handle polls with no votes', () => {
    // Arrange
    const pollWithNoVotes = {
      ...mockPoll,
      votes: [0, 0, 0],
    }

    // Act
    render(<PollCard poll={pollWithNoVotes} />)

    // Assert
    expect(screen.getByText('0 votes')).toBeInTheDocument()
  })

  it('should display formatted creation date', () => {
    // Arrange
    const pollWithSpecificDate = {
      ...mockPoll,
      created_at: '2024-01-15T10:30:00Z',
    }

    // Act
    render(<PollCard poll={pollWithSpecificDate} />)

    // Assert
    // The exact format may vary based on locale, but should contain date elements
    expect(screen.getByText(/2024|Jan|15/)).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    // Arrange
    const customClass = 'custom-poll-card'

    // Act
    const { container } = render(
      <PollCard poll={mockPoll} className={customClass} />
    )

    // Assert
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('should handle long titles and descriptions gracefully', () => {
    // Arrange
    const pollWithLongContent = {
      ...mockPoll,
      title: 'This is a very long poll title that might need to be truncated or wrapped properly in the UI component',
      description: 'This is an extremely long description that contains a lot of text and should be handled properly by the component without breaking the layout or causing any visual issues in the user interface',
    }

    // Act
    render(<PollCard poll={pollWithLongContent} />)

    // Assert
    expect(screen.getByText(pollWithLongContent.title)).toBeInTheDocument()
    expect(screen.getByText(pollWithLongContent.description)).toBeInTheDocument()
  })

  it('should handle polls with many options', () => {
    // Arrange
    const pollWithManyOptions = {
      ...mockPoll,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6'],
      votes: [10, 8, 6, 4, 2, 1], // Total: 31 votes
    }

    // Act
    render(<PollCard poll={pollWithManyOptions} />)

    // Assert
    expect(screen.getByText('31 votes')).toBeInTheDocument()
  })

  it('should display poll status badge with correct styling', () => {
    // Act
    render(<PollCard poll={mockPoll} />)

    // Assert
    const statusBadge = screen.getByText('Active')
    expect(statusBadge).toBeInTheDocument()
    // The badge should have appropriate styling classes
    expect(statusBadge.closest('.badge, [class*="badge"]')).toBeInTheDocument()
  })

  it('should handle edge case with single vote', () => {
    // Arrange
    const pollWithSingleVote = {
      ...mockPoll,
      votes: [1, 0, 0],
    }

    // Act
    render(<PollCard poll={pollWithSingleVote} />)

    // Assert
    expect(screen.getByText('1 vote')).toBeInTheDocument() // Should be singular
  })
})