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
    createdBy: string
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
        votes: new Array(pollData.options.length).fill(0),
        created_by: pollData.createdBy,
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
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findPollsByUserId(userId: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async findAllActivePolls() {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async updatePoll(id: string, updates: any, userId?: string) {
    const supabase = await this.getClient()
    
    if (!userId) {
      throw new Error('User ID is required for poll updates')
    }
    
    // Use the custom update_user_poll function with SECURITY DEFINER
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    try {
      const { data, error } = await supabase
        .rpc('update_user_poll', {
          poll_id: id,
          user_id: userId,
          update_data: updateData
        })
      
      if (error) {
        console.error('Poll update error:', error)
        throw error
      }
      
      // Return the first result since the function returns SETOF polls
      return data && data.length > 0 ? data[0] : null
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
      .select()
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

  async findVoteByUserAndPoll(userId: string, pollId: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .eq('poll_id', pollId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findVotesByPollId(pollId: string) {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// Database instance
const db = new SupabaseDatabase()

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
      createdBy: string
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