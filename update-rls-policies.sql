-- MANUAL FIX: Run this SQL in your Supabase SQL Editor to fix voting issues
-- This will allow anonymous voting on polls that don't require login

-- Step 1: Drop existing problematic vote policies
DROP POLICY IF EXISTS "Authenticated users can vote on active polls" ON public.votes;
DROP POLICY IF EXISTS "votes_insert_authenticated" ON public.votes;
DROP POLICY IF EXISTS "Authenticated users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Users can vote on active polls" ON public.votes;

-- Step 2: Create new policy that allows anonymous voting when poll doesn't require login
CREATE POLICY "allow_voting_based_on_poll_settings" ON public.votes
  FOR INSERT WITH CHECK (
    -- Ensure poll exists and is active
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_id 
      AND polls.is_active = true
      AND (polls.expiration_date IS NULL OR polls.expiration_date > NOW())
    ) AND
    -- Check authentication requirements based on poll settings
    (
      -- Case 1: Poll requires login - user must be authenticated
      (EXISTS (
        SELECT 1 FROM public.polls 
        WHERE polls.id = poll_id AND polls.require_login = true
      ) AND auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
      OR
      -- Case 2: Poll doesn't require login - allow anonymous votes
      (EXISTS (
        SELECT 1 FROM public.polls 
        WHERE polls.id = poll_id AND polls.require_login = false
      ) AND (user_id IS NULL OR auth.uid()::text = user_id))
    ) AND
    -- Prevent duplicate votes (only for authenticated users)
    (
      user_id IS NULL OR
      NOT EXISTS (
        SELECT 1 FROM public.votes 
        WHERE votes.poll_id = poll_id 
        AND votes.user_id = user_id
      )
    )
  );

-- Step 3: Ensure other vote policies exist
CREATE POLICY IF NOT EXISTS "allow_read_votes" ON public.votes
  FOR SELECT USING (true);

-- Step 4: Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'votes' AND schemaname = 'public';

-- Step 5: Test query - this should work for anonymous users on polls with require_login = false
-- SELECT * FROM public.polls WHERE require_login = false LIMIT 1;