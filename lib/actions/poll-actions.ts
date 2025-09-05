'use server'

import { SupabaseDatabase, database } from '../database'
import { AuthServer } from '../auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createPollSchema, voteSchema, togglePollSchema } from '../validations'
import { createPaginationInfo, validatePaginationParams, DEFAULT_PAGE_SIZE } from '../utils/pagination'
import { z } from 'zod'

export async function getAllActivePolls(page = 0, limit = DEFAULT_PAGE_SIZE) {
  try {
    const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit)
    const [polls, totalCount] = await Promise.all([
      database.polls.findAllActive(),
      database.polls.findAllActive().then(polls => polls.length)
    ])
    
    return { 
      success: true, 
      polls,
      pagination: createPaginationInfo(validPage, validLimit, totalCount)
    }
  } catch (error) {
    console.error('Failed to fetch polls:', error)
    return { 
      success: false, 
      error: 'Failed to fetch polls',
      polls: []
    }
  }
}

export async function getUserPolls(page = 0, limit = DEFAULT_PAGE_SIZE) {
  try {
    const user = await AuthServer.getCurrentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated', polls: [] }
    }

    const { page: validPage, limit: validLimit } = validatePaginationParams(page, limit)
    const [polls, totalCount] = await Promise.all([
      database.polls.findByUserId(user.id),
      database.polls.findByUserId(user.id).then(polls => polls.length)
    ])
    
    return { 
      success: true, 
      polls,
      pagination: createPaginationInfo(validPage, validLimit, totalCount)
    }
  } catch (error) {
    console.error('Failed to fetch user polls:', error)
    return { 
      success: false, 
      error: 'Failed to fetch user polls',
      polls: []
    }
  }
}

export async function createPoll(formData: FormData) {
  try {
    // Get current user
    const user = await AuthServer.getCurrentUser()
    if (!user) {
      return { success: false, error: 'Please log in to create a poll' }
    }

    // Extract and parse form data
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const optionsJson = formData.get('options') as string
    const settingsJson = formData.get('settings') as string

    // Validate form data exists
    if (!optionsJson || !settingsJson) {
      return { success: false, error: 'Invalid form data. Please try again.' }
    }

    // Parse options and settings with error handling
    let options, settings
    try {
      options = JSON.parse(optionsJson)
      settings = JSON.parse(settingsJson)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return { success: false, error: 'Invalid form data format. Please refresh and try again.' }
    }

    // Validate input using Zod schema
    const validationResult = createPollSchema.safeParse({
      title,
      description,
      options,
      expirationDate: settings.expirationDate || undefined,
      requireLogin: settings.requireLogin || false,
      allowMultipleSelections: settings.allowMultipleSelections || false
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues?.[0]
      return { success: false, error: firstError?.message || 'Validation failed. Please check your input.' }
    }

    const validatedData = validationResult.data
    
    // Parse expiration date if provided
    let parsedExpirationDate: Date | null = null
    if (validatedData.expirationDate) {
      parsedExpirationDate = new Date(validatedData.expirationDate)
    }

    // Prepare poll data using validated input
    const pollData = {
      title: validatedData.title,
      description: validatedData.description || '',
      options: validatedData.options,
      expirationDate: parsedExpirationDate?.toISOString() || undefined,
      requireLogin: validatedData.requireLogin,
      allowMultipleSelections: validatedData.allowMultipleSelections,
      created_by: user.id
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
      error: 'Unable to create poll at this time. Please try again later.' 
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
    if (!id?.trim()) {
      return { success: false, error: 'Invalid poll ID' }
    }

    const poll = await database.polls.findById(id)
    
    if (!poll) {
      return { success: false, error: 'Poll not found. It may have been deleted or the link is incorrect.' }
    }
    
    return { success: true, data: poll }
  } catch (error) {
    console.error('Error fetching poll:', error)
    return { success: false, error: 'Unable to load poll at this time. Please try again later.' }
  }
}

export async function togglePollActive(pollId: string, nextActive: boolean) {
  try {
    if (!pollId?.trim()) {
      return { success: false, error: 'Invalid poll ID' }
    }

    // Get current user using getCurrentUser like other successful functions
    const user = await AuthServer.getCurrentUser()
    if (!user) {
      return { success: false, error: 'Please log in to manage your polls' }
    }

    // Load the poll to check ownership using database abstraction
    const poll = await database.polls.findById(pollId)
    if (!poll) {
      return { success: false, error: 'Poll not found. It may have been deleted.' }
    }

    // Check if user is the poll owner
    if (poll.created_by !== user.id) {
      return { success: false, error: 'You can only manage polls that you created' }
    }

    // Update the poll using database abstraction layer with userId for RLS
    const updatedPoll = await database.polls.update(pollId, {
      is_active: nextActive,
      updated_at: new Date().toISOString()
    }, user.id)

    // Revalidate paths
    revalidatePath('/polls')
    revalidatePath('/polls/my')
    revalidatePath(`/polls/${pollId}`)

    const statusMessage = nextActive ? 'Poll activated successfully' : 'Poll deactivated successfully'
    return { success: true, poll: updatedPoll, message: statusMessage }
  } catch (error) {
    console.error('Error toggling poll active state:', error)
    return { success: false, error: 'Unable to update poll status at this time. Please try again later.' }
  }
}

export async function togglePollActiveAction(pollId: string, isActive: boolean) {
  try {
    // Validate input using Zod schema
    const validationResult = togglePollSchema.safeParse({
      pollId,
      isActive
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { success: false, error: firstError.message }
    }

    return await togglePollActive(validationResult.data.pollId, validationResult.data.isActive)
  } catch (error) {
    console.error('Error in togglePollActiveAction:', error)
    return { success: false, error: 'Unable to update poll status. Please try again later.' }
  }
}

export async function submitVote(pollId: string, optionIndex: number, userId?: string) {
  try {
    // Validate input parameters
    if (!pollId?.trim()) {
      return { success: false, error: 'Invalid poll ID' }
    }

    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return { success: false, error: 'Invalid option selected' }
    }

    // Check if poll exists
    const poll = await database.polls.findById(pollId)
    if (!poll) {
      return { success: false, error: 'Poll not found. It may have been deleted or the link is incorrect.' }
    }
    
    // Check if poll requires login and user is not authenticated
    if (poll.require_login && !userId) {
      return { success: false, error: 'Please log in to vote on this poll' }
    }
    
    // Check if poll is expired
    if (poll.expiration_date && new Date() > new Date(poll.expiration_date)) {
      return { success: false, error: 'This poll has expired and is no longer accepting votes' }
    }
    
    // Check if poll is active
    if (!poll.is_active) {
      return { success: false, error: 'This poll is currently inactive and not accepting votes' }
    }
    
    // Validate option index against available options
    if (optionIndex >= poll.options.length) {
      return { success: false, error: 'Selected option is not available for this poll' }
    }
    
    // Check if user has already voted (if logged in)
    if (userId) {
      try {
        const existingVote = await database.votes.findByUserAndPoll(userId, pollId)
      if (existingVote && !poll.allow_multiple_selections) {
        return { success: false, error: 'You have already voted on this poll. Multiple votes are not allowed.' }
      }
      } catch (voteCheckError) {
        console.error('Error checking existing vote:', voteCheckError)
        // Continue with vote submission if vote check fails
      }
    }
    
    // Submit vote
    try {
      await database.votes.create({ 
        pollId: pollId, 
        userId: userId, 
        optionIndex: optionIndex 
      })
    } catch (voteError) {
      console.error('Error creating vote:', voteError)
      return { success: false, error: 'Unable to record your vote at this time. Please try again.' }
    }
    
    return { success: true, message: 'Your vote has been recorded successfully!' }
  } catch (error) {
    console.error('Error submitting vote:', error)
    return { success: false, error: 'Unable to submit your vote at this time. Please try again later.' }
  }
}

export async function submitVoteAction(formData: FormData) {
  try {
    const pollId = formData.get('pollId') as string
    const optionIndexStr = formData.get('optionIndex') as string
    
    // Parse option index
    const optionIndex = parseInt(optionIndexStr)
    
    // Validate input using Zod schema
    const validationResult = voteSchema.safeParse({
      pollId,
      optionIndex
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { success: false, error: firstError.message }
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
    
    return await submitVote(validationResult.data.pollId, validationResult.data.optionIndex, userId)
  } catch (error) {
    console.error('Error in submitVoteAction:', error)
    return { success: false, error: 'Unable to submit your vote at this time. Please try again later.' }
  }
}