'use server'

import { database } from '@/lib/database'
import { AuthServer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getAllActivePolls() {
  try {
    const polls = await database.polls.findAllActive()
    return { success: true, polls }
  } catch (error) {
    console.error('Failed to fetch polls:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch polls',
      polls: []
    }
  }
}

export async function getUserPolls() {
  try {
    const user = await AuthServer.getCurrentUser()
    if (!user) {
      return { success: false, error: 'Authentication required', polls: [] }
    }

    const polls = await database.polls.findByUserId(user.id)
    return { success: true, polls }
  } catch (error) {
    console.error('Failed to fetch user polls:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user polls',
      polls: []
    }
  }
}

export async function createPoll(formData: FormData) {
  try {
    // Get current user
    const user = await AuthServer.getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }

    // Extract form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const optionsJson = formData.get('options') as string
    const settingsJson = formData.get('settings') as string

    // Parse options and settings
    const options = JSON.parse(optionsJson)
    const settings = JSON.parse(settingsJson)

    // Validate required fields
    if (!title?.trim()) {
      throw new Error('Poll title is required')
    }

    if (!options || options.length < 2) {
      throw new Error('At least 2 options are required')
    }

    // Prepare poll data
    const pollData = {
      title: title.trim(),
      description: description?.trim() || undefined,
      options: options,
      createdBy: user.id,
      allowMultipleSelections: settings.allowMultipleSelections || false,
      requireLogin: settings.requireLogin || false,
      expirationDate: settings.expirationDate || undefined,
    }

    // Create poll in database
    const poll = await database.polls.create(pollData)

    // Revalidate polls page
    revalidatePath('/polls')

    return { success: true, poll }
  } catch (error) {
    console.error('Failed to create poll:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create poll' 
    }
  }
}

export async function createPollAction(prevState: any, formData: FormData) {
  const result = await createPoll(formData)
  
  if (result.success) {
    redirect('/polls')
  }
  
  return result
}

export async function getPollById(id: string) {
  try {
    const poll = await database.polls.findById(id)
    
    if (!poll) {
      return { success: false, error: 'Poll not found' }
    }
    
    return { success: true, data: poll }
  } catch (error) {
    console.error('Error fetching poll:', error)
    return { success: false, error: 'Failed to fetch poll' }
  }
}

export async function submitVote(pollId: string, optionIndex: number, userId?: string) {
  try {
    // Check if poll exists
    const poll = await database.polls.findById(pollId)
    if (!poll) {
      return { success: false, error: 'Poll not found' }
    }
    
    // Check if poll requires login and user is not authenticated
    if (poll.require_login && !userId) {
      return { success: false, error: 'Login required to vote on this poll' }
    }
    
    // Check if poll is expired
    if (poll.expiration_date && new Date() > new Date(poll.expiration_date)) {
      return { success: false, error: 'This poll has expired' }
    }
    
    // Check if poll is active
    if (!poll.is_active) {
      return { success: false, error: 'This poll is no longer active' }
    }
    
    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return { success: false, error: 'Invalid option selected' }
    }
    
    // Check if user has already voted (if logged in)
    if (userId) {
      const existingVote = await database.votes.findByUserAndPoll(userId, pollId)
      if (existingVote && !poll.allow_multiple_selections) {
        return { success: false, error: 'You have already voted on this poll' }
      }
    }
    
    // Submit vote
    await database.votes.create({ pollId, userId, optionIndex })
    
    return { success: true, message: 'Vote submitted successfully!' }
  } catch (error) {
    console.error('Error submitting vote:', error)
    return { success: false, error: 'Failed to submit vote' }
  }
}

export async function submitVoteAction(formData: FormData) {
  try {
    const pollId = formData.get('pollId') as string
    const optionIndex = parseInt(formData.get('optionIndex') as string)
    
    if (!pollId || isNaN(optionIndex)) {
      return { success: false, error: 'Missing required fields' }
    }
    
    // Get current user if available
    let userId: string | undefined
    try {
      const user = await AuthServer.getCurrentUser()
      userId = user?.id
    } catch {
      // User not authenticated, continue without userId
      userId = undefined
    }
    
    return await submitVote(pollId, optionIndex, userId)
  } catch (error) {
    console.error('Error in submitVoteAction:', error)
    return { success: false, error: 'Failed to submit vote' }
  }
}