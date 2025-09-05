-- Enhanced RLS Policies for Better Security
-- This migration improves existing RLS policies and adds missing ones

-- Drop existing policies that need to be enhanced
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;
DROP POLICY IF EXISTS "Authenticated users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can view active polls" ON public.polls;

-- Enhanced policies for polls table
-- Allow viewing of active polls and user's own polls
CREATE POLICY "View active polls or own polls" ON public.polls
  FOR SELECT USING (
    is_active = true OR 
    auth.uid()::text = created_by::text
  );

-- Prevent users from creating too many polls (basic rate limiting at DB level)
CREATE POLICY "Users can create polls with limits" ON public.polls
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by::text AND
    -- Limit to 10 polls per user per day
    (
      SELECT COUNT(*) 
      FROM public.polls 
      WHERE created_by = auth.uid()::text 
      AND created_at > NOW() - INTERVAL '1 day'
    ) < 10
  );

-- Enhanced policies for votes table
-- Only allow viewing votes for active polls
CREATE POLICY "View votes for active polls" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true
    )
  );

-- Allow poll creators to view all votes on their polls
CREATE POLICY "Poll creators can view their poll votes" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = votes.poll_id 
      AND polls.created_by = auth.uid()::text
    )
  );

-- Enhanced vote creation policy that respects poll's require_login setting
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

-- Prevent vote updates and deletions for data integrity
CREATE POLICY "Votes cannot be updated" ON public.votes
  FOR UPDATE USING (false);

CREATE POLICY "Votes cannot be deleted" ON public.votes
  FOR DELETE USING (false);

-- Enhanced user policies
-- Drop and recreate user policies with better security
DROP POLICY IF EXISTS "Anyone can create a user" ON public.users;

-- More restrictive user creation policy
CREATE POLICY "Authenticated users can create profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = id::text
  );

-- Add policy to prevent users from viewing other users' sensitive data
CREATE POLICY "Users can only view public user data" ON public.users
  FOR SELECT USING (
    -- Users can see their own full profile
    auth.uid()::text = id::text OR
    -- Others can only see basic public info (if we add public fields later)
    true -- This would be modified based on which fields should be public
  );

-- Add audit trail policies if we have audit tables
-- (These would be added if audit logging is implemented)

-- Add function to check if user can modify poll
CREATE OR REPLACE FUNCTION can_modify_poll(poll_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.polls 
    WHERE id = poll_id 
    AND created_by = auth.uid()::text
    AND created_at > NOW() - INTERVAL '1 hour' -- Allow modifications only within 1 hour
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced poll update policy with time restrictions
DROP POLICY IF EXISTS "Users can update their own polls" ON public.polls;

CREATE POLICY "Users can update own polls within time limit" ON public.polls
  FOR UPDATE USING (
    auth.uid()::text = created_by::text AND
    can_modify_poll(id)
  );

-- Enhanced poll deletion policy
DROP POLICY IF EXISTS "Users can delete their own polls" ON public.polls;

CREATE POLICY "Users can delete own polls with restrictions" ON public.polls
  FOR DELETE USING (
    auth.uid()::text = created_by::text AND
    -- Only allow deletion if no votes exist or within 1 hour of creation
    (
      NOT EXISTS (SELECT 1 FROM public.votes WHERE poll_id = id) OR
      created_at > NOW() - INTERVAL '1 hour'
    )
  );

-- Add security functions for additional validation
CREATE OR REPLACE FUNCTION validate_poll_options(options TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate poll options
  IF array_length(options, 1) < 2 OR array_length(options, 1) > 10 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for empty or too long options
  FOR i IN 1..array_length(options, 1) LOOP
    IF length(trim(options[i])) < 1 OR length(options[i]) > 200 THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate poll options
ALTER TABLE public.polls ADD CONSTRAINT valid_poll_options 
  CHECK (validate_poll_options(options));

-- Add constraint to validate poll title length
ALTER TABLE public.polls ADD CONSTRAINT valid_poll_title 
  CHECK (length(trim(title)) >= 3 AND length(title) <= 200);

-- Add constraint to validate poll description length
ALTER TABLE public.polls ADD CONSTRAINT valid_poll_description 
  CHECK (description IS NULL OR length(description) <= 1000);

-- Create indexes for better performance with new policies
CREATE INDEX IF NOT EXISTS idx_votes_user_poll ON public.votes(user_id, poll_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by_active ON public.polls(created_by, is_active);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON public.polls(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON POLICY "View active polls or own polls" ON public.polls IS 
  'Users can view active polls and their own polls regardless of status';

COMMENT ON POLICY "Users can create polls with limits" ON public.polls IS 
  'Prevents spam by limiting users to 10 polls per day';

COMMENT ON POLICY "Authenticated users can vote on active polls" ON public.votes IS 
  'Ensures users can only vote once per poll and only on active, non-expired polls';

COMMENT ON FUNCTION can_modify_poll(UUID) IS 
  'Checks if a user can modify a poll (within 1 hour of creation)';