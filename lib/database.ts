// Database connection and utilities using Supabase
import { createServerSupabaseClient, Database } from './supabase'
import { User } from '@supabase/supabase-js'

// Supabase database operations
class SupabaseDatabase {
  private async getClient() {
    return await createServerSupabaseClient()
  }
  


  // User operations
  async createUser(userData: { email: string; name: string; id?: string }) {
    const supabase = await this.getClient()
    const insertData: any = {
      email: userData.email,
      name: userData.name,
    }
    
    // If ID is provided (e.g., from Supabase Auth), use it
    if (userData.id) {
      insertData.id = userData.id
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async findUserByEmail(email: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findUserById(id: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateUser(id: string, updates: { email?: string; name?: string }) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Poll operations
  async createPoll(pollData: {
    title: string
    description?: string
    options: string[]
    created_by: string
    allowMultipleSelections?: boolean
    requireLogin?: boolean
    expirationDate?: string
  }) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description || null,
        options: pollData.options,
        votes: new Array(pollData.options?.length || 0).fill(0),
        created_by: pollData.created_by,
        is_active: true,
        allow_multiple_selections: pollData.allowMultipleSelections || false,
        require_login: pollData.requireLogin || false,
        expiration_date: pollData.expirationDate || null,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async findPollById(id: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('polls')
      .select('id, title, description, options, votes, created_by, is_active, allow_multiple_selections, require_login, expiration_date, created_at, updated_at')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findPollsByUserId(userId: string, page?: number, limit?: number) {
    const supabase = await this.getClient()
    let query = supabase
      .from('polls')
      .select('id, title, description, options, votes, created_by, is_active, allow_multiple_selections, require_login, expiration_date, created_at, updated_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    // Add pagination if specified
    if (page !== undefined && limit !== undefined) {
      const from = page * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  async findAllActivePolls(page?: number, limit?: number) {
    const supabase = await this.getClient()
    let query = supabase
      .from('polls')
      .select('id, title, description, options, votes, created_by, is_active, allow_multiple_selections, require_login, expiration_date, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    // Add pagination if specified
    if (page !== undefined && limit !== undefined) {
      const from = page * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  async updatePoll(id: string, updates: any, userId?: string) {
    const supabase = await this.getClient()
    
    if (!userId) {
      throw new Error('User ID is required for poll updates')
    }
    
    try {
      console.log('UpdatePoll called with:', { id, updates, userId })
      
      // First verify the poll belongs to the user
      const { data: existingPoll, error: fetchError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .eq('created_by', userId)
        .single()

      if (fetchError || !existingPoll) {
        console.error('Poll fetch error:', fetchError)
        throw new Error('Poll not found or access denied')
      }

      // Update the poll
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await supabase
        .from('polls')
        .update(updateData)
        .eq('id', id)
        .eq('created_by', userId)
        .select()
        .single()
      
      if (error) {
        console.error('Poll update error:', error)
        throw new Error(`Failed to update poll: ${error.message}`)
      }
      
      return data
    } catch (error) {
      console.error('UpdatePoll error:', error)
      throw error
    }
  }

  async deletePoll(id: string) {
    const supabase = await this.getClient()
    
    // First delete associated votes
    await supabase.from('votes').delete().eq('poll_id', id)
    
    // Then delete the poll
    const { data, error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Vote operations
  async createVote(voteData: {
    pollId: string
    userId?: string
    optionIndex: number
  }) {
    const supabase = await this.getClient()
    
    // Create the vote record
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: voteData.pollId,
        user_id: voteData.userId || null,
        option_index: voteData.optionIndex,
      })
      .select('id, poll_id, user_id, option_index, created_at')
      .single()
    
    if (voteError) throw voteError
    
    // Update poll vote count
    const poll = await this.findPollById(voteData.pollId)
    if (poll) {
      const newVotes = [...poll.votes]
      newVotes[voteData.optionIndex] += 1
      await this.updatePoll(poll.id, { votes: newVotes })
    }
    
    return vote
  }

  // Pagination helper methods
  async getActivePollsCount() {
    const supabase = await this.getClient()
    const { count, error } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (error) throw error
    return count || 0
  }

  async getUserPollsCount(userId: string) {
    const supabase = await this.getClient()
    const { count, error } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
    
    if (error) throw error
    return count || 0
  }

  async getPollVotesCount(pollId: string) {
    const supabase = await this.getClient()
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
    
    if (error) throw error
    return count || 0
  }

  async findVoteByUserAndPoll(userId: string, pollId: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('votes')
      .select('id, poll_id, user_id, option_index, created_at')
      .eq('user_id', userId)
      .eq('poll_id', pollId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findVotesByPollId(pollId: string, page?: number, limit?: number) {
    const supabase = await this.getClient()
    let query = supabase
      .from('votes')
      .select('id, poll_id, user_id, option_index, created_at')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })
    
    // Add pagination if specified
    if (page !== undefined && limit !== undefined) {
      const from = page * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }
}

// Database instance
const db = new SupabaseDatabase()

// Export the Database class for direct instantiation
export { SupabaseDatabase }

// Database operations
export const database = {
  // User operations
  users: {
    create: (userData: { email: string; name: string; id?: string }) => db.createUser(userData),
    findByEmail: (email: string) => db.findUserByEmail(email),
    findById: (id: string) => db.findUserById(id),
    update: (id: string, updates: { email?: string; name?: string }) => db.updateUser(id, updates),
  },

  // Poll operations
  polls: {
    create: (pollData: {
      title: string
      description?: string
      options: string[]
      created_by: string
      allowMultipleSelections?: boolean
      requireLogin?: boolean
      expirationDate?: string
    }) => db.createPoll(pollData),
    findById: (id: string) => db.findPollById(id),
    findByUserId: (userId: string) => db.findPollsByUserId(userId),
    findAllActive: () => db.findAllActivePolls(),
    update: (id: string, updates: any, userId?: string) => db.updatePoll(id, updates, userId),
    delete: (id: string) => db.deletePoll(id),
  },

  // Vote operations
  votes: {
    create: (voteData: {
      pollId: string
      userId?: string
      optionIndex: number
    }) => db.createVote(voteData),
    findByUserAndPoll: (userId: string, pollId: string) => db.findVoteByUserAndPoll(userId, pollId),
    findByPollId: (pollId: string) => db.findVotesByPollId(pollId),
  },
};

// Connection utilities
export const connectDatabase = async () => {
  try {
    // Supabase handles connections automatically
    console.log('Supabase client initialized');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    // Supabase handles disconnections automatically
    console.log('Supabase client disconnected');
    return true;
  } catch (error) {
    console.error('Supabase disconnection failed:', error);
    throw error;
  }
};

// Export Supabase client for direct access if needed
export { createServerSupabaseClient, supabase } from './supabase';
export type { Database } from './supabase';