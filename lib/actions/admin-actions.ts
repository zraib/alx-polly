'use server'

import { createClient } from '@supabase/supabase-js'

// Admin action to update RLS policies
export async function updateRLSPolicies() {
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Drop existing vote policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Authenticated users can vote on active polls" ON public.votes;
      DROP POLICY IF EXISTS "votes_insert_authenticated" ON public.votes;
      DROP POLICY IF EXISTS "Authenticated users can create votes" ON public.votes;
    `

    // Create new policy that respects poll's require_login setting
    const createPolicy = `
      CREATE POLICY "Users can vote on active polls" ON public.votes
        FOR INSERT WITH CHECK (
          -- Ensure poll is active
          EXISTS (
            SELECT 1 FROM public.polls 
            WHERE polls.id = poll_id 
            AND polls.is_active = true
            AND (polls.expiration_date IS NULL OR polls.expiration_date > NOW())
          ) AND
          -- Check authentication requirements based on poll settings
          (
            -- If poll requires login, user must be authenticated and user_id must match
            (EXISTS (
              SELECT 1 FROM public.polls 
              WHERE polls.id = poll_id AND polls.require_login = true
            ) AND auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
            OR
            -- If poll doesn't require login, allow anonymous votes (user_id can be null)
            (EXISTS (
              SELECT 1 FROM public.polls 
              WHERE polls.id = poll_id AND polls.require_login = false
            ) AND (user_id IS NULL OR auth.uid()::text = user_id::text))
          ) AND
          -- Prevent duplicate votes for authenticated users
          (
            user_id IS NULL OR
            NOT EXISTS (
              SELECT 1 FROM public.votes 
              WHERE votes.poll_id = NEW.poll_id 
              AND votes.user_id = NEW.user_id
            )
          )
        );
    `

    // Execute the SQL commands
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', { sql: dropPolicies })
    if (dropError) {
      console.log('Drop policies result:', dropError) // May fail if policies don't exist
    }

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createPolicy })
    if (createError) {
      throw createError
    }

    return { success: true, message: 'RLS policies updated successfully' }
  } catch (error) {
    console.error('Error updating RLS policies:', error)
    return { success: false, error: 'Failed to update RLS policies' }
  }
}

// Alternative approach using direct SQL execution
export async function updateRLSPoliciesDirectSQL() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Drop existing policies
    await supabaseAdmin.rpc('exec', { 
      sql: 'DROP POLICY IF EXISTS "Authenticated users can vote on active polls" ON public.votes;' 
    })
    
    await supabaseAdmin.rpc('exec', { 
      sql: 'DROP POLICY IF EXISTS "votes_insert_authenticated" ON public.votes;' 
    })
    
    await supabaseAdmin.rpc('exec', { 
      sql: 'DROP POLICY IF EXISTS "Authenticated users can create votes" ON public.votes;' 
    })

    // Create new policy
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE POLICY "Users can vote on active polls" ON public.votes
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.polls 
              WHERE polls.id = poll_id 
              AND polls.is_active = true
              AND (polls.expiration_date IS NULL OR polls.expiration_date > NOW())
            ) AND
            (
              (EXISTS (
                SELECT 1 FROM public.polls 
                WHERE polls.id = poll_id AND polls.require_login = true
              ) AND auth.uid() IS NOT NULL AND auth.uid()::text = user_id::text)
              OR
              (EXISTS (
                SELECT 1 FROM public.polls 
                WHERE polls.id = poll_id AND polls.require_login = false
              ) AND (user_id IS NULL OR auth.uid()::text = user_id::text))
            ) AND
            (
              user_id IS NULL OR
              NOT EXISTS (
                SELECT 1 FROM public.votes 
                WHERE votes.poll_id = NEW.poll_id 
                AND votes.user_id = NEW.user_id
              )
            )
          );
      `
    })

    if (error) {
      throw error
    }

    return { success: true, message: 'RLS policies updated successfully' }
  } catch (error) {
    console.error('Error updating RLS policies:', error)
    return { success: false, error: `Failed to update RLS policies: ${error}` }
  }
}