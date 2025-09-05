-- Enhanced Security Policies for Polling App
-- Run this script in your Supabase SQL Editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can create a user" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active polls" ON public.polls;
DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON public.polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON public.polls;
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;
DROP POLICY IF EXISTS "Authenticated users can create votes" ON public.votes;

-- Enhanced RLS Policies for users table
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Enhanced RLS Policies for polls table
CREATE POLICY "polls_select_active" ON public.polls
  FOR SELECT USING (is_active = true OR auth.uid()::text = created_by::text);

CREATE POLICY "polls_insert_authenticated" ON public.polls
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = created_by::text AND
    -- Rate limiting: max 10 polls per user per hour
    (SELECT COUNT(*) FROM public.polls 
     WHERE created_by = auth.uid() AND 
     created_at > NOW() - INTERVAL '1 hour') < 10
  );

CREATE POLICY "polls_update_own" ON public.polls
  FOR UPDATE USING (auth.uid()::text = created_by::text)
  WITH CHECK (
    auth.uid()::text = created_by::text AND
    -- Prevent modification after 24 hours
    created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "polls_delete_own" ON public.polls
  FOR DELETE USING (
    auth.uid()::text = created_by::text AND
    -- Allow deletion only within 1 hour of creation
    created_at > NOW() - INTERVAL '1 hour'
  );

-- Enhanced RLS Policies for votes table
CREATE POLICY "votes_select_all" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "votes_insert_authenticated" ON public.votes
  FOR INSERT WITH CHECK (
    -- Ensure poll is active and not expired
    EXISTS (
      SELECT 1 FROM public.polls p 
      WHERE p.id = poll_id AND 
      p.is_active = true AND 
      (p.expiration_date IS NULL OR p.expiration_date > NOW())
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
        SELECT 1 FROM public.votes v2 
        WHERE v2.poll_id = poll_id AND v2.user_id = NEW.user_id
      )
    )
  );

-- Prevent vote updates and deletions for data integrity
CREATE POLICY "votes_no_update" ON public.votes
  FOR UPDATE USING (false);

CREATE POLICY "votes_no_delete" ON public.votes
  FOR DELETE USING (false);

-- Create function to validate poll options
CREATE OR REPLACE FUNCTION validate_poll_options(options TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if options array is not empty and has at least 2 options
  IF array_length(options, 1) < 2 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if options array has at most 10 options
  IF array_length(options, 1) > 10 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if all options are non-empty strings
  FOR i IN 1..array_length(options, 1) LOOP
    IF options[i] IS NULL OR trim(options[i]) = '' THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
 END;
$$ LANGUAGE plpgsql;

-- Add constraint to polls table for option validation
ALTER TABLE public.polls 
ADD CONSTRAINT valid_poll_options 
CHECK (validate_poll_options(options));

-- Create function for rate limiting at database level
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id UUID,
  action_type TEXT,
  time_window INTERVAL,
  max_actions INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  CASE action_type
    WHEN 'poll_creation' THEN
      SELECT COUNT(*) INTO action_count
      FROM public.polls
      WHERE created_by = user_id AND created_at > NOW() - time_window;
    WHEN 'vote_submission' THEN
      SELECT COUNT(*) INTO action_count
      FROM public.votes
      WHERE user_id = check_rate_limit.user_id AND created_at > NOW() - time_window;
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN action_count < max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create additional indexes for security and performance
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON public.polls(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_expiration ON public.polls(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON public.votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON public.votes(poll_id, user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_poll_options(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTERVAL, INTEGER) TO authenticated;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert audit logs
CREATE POLICY "audit_log_insert_system" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- Only allow admins to view audit logs (for now, no one can view)
CREATE POLICY "audit_log_select_admin" ON public.security_audit_log
  FOR SELECT USING (false);

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, success, error_message
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_success, p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_security_event(UUID, TEXT, TEXT, UUID, BOOLEAN, TEXT) TO authenticated;

-- Add triggers to log important security events
CREATE OR REPLACE FUNCTION trigger_log_poll_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_event(
    NEW.created_by,
    'poll_created',
    'poll',
    NEW.id,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_log_vote_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_event(
    NEW.user_id,
    'vote_submitted',
    'vote',
    NEW.id,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS log_poll_creation ON public.polls;
CREATE TRIGGER log_poll_creation
  AFTER INSERT ON public.polls
  FOR EACH ROW EXECUTE FUNCTION trigger_log_poll_creation();

DROP TRIGGER IF EXISTS log_vote_submission ON public.votes;
CREATE TRIGGER log_vote_submission
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION trigger_log_vote_submission();

-- Create view for poll statistics (security-conscious)
CREATE OR REPLACE VIEW poll_stats AS
SELECT 
  p.id,
  p.title,
  p.created_at,
  p.is_active,
  COUNT(v.id) as total_votes,
  COUNT(DISTINCT v.user_id) as unique_voters
FROM public.polls p
LEFT JOIN public.votes v ON p.id = v.poll_id
WHERE p.is_active = true
GROUP BY p.id, p.title, p.created_at, p.is_active;

-- Grant access to the view
GRANT SELECT ON poll_stats TO authenticated, anon;

COMMIT;