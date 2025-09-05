'use server'

import { database } from '../database'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function seedDatabase() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to seed database')
    }

    // Sample polls data
    const samplePolls = [
      {
        title: 'What is your favorite programming language?',
        description: 'Help us understand the community preferences for programming languages.',
        options: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'],
        created_by: user.id,
        allowMultipleSelections: false,
        requireLogin: false,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      {
        title: 'Best time for team meetings?',
        description: 'When should we schedule our weekly team meetings?',
        options: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'],
        created_by: user.id,
        allowMultipleSelections: false,
        requireLogin: false,
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      },
      {
        title: 'Preferred work environment?',
        description: 'What type of work environment do you prefer?',
        options: ['Remote', 'Office', 'Hybrid', 'Co-working space'],
        created_by: user.id,
        allowMultipleSelections: true,
        requireLogin: false,
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      }
    ]

    // Create the polls
    const results = []
    for (const pollData of samplePolls) {
      const poll = await database.polls.create(pollData)
      results.push(poll)
    }

    return {
      success: true,
      message: `Successfully created ${results.length} sample polls`,
      polls: results
    }
  } catch (error) {
    console.error('Error seeding database:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to seed database'
    }
  }
}