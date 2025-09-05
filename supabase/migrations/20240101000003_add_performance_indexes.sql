-- Add indexes for better query performance

-- Index for polls table
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_active_created_at ON polls(is_active, created_at DESC);

-- Index for votes table
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_poll ON votes(user_id, poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_polls_user_active ON polls(created_by, is_active, created_at DESC);

-- Index for expiration date queries (if we add expiration functionality)
CREATE INDEX IF NOT EXISTS idx_polls_expiration ON polls(expiration_date) WHERE expiration_date IS NOT NULL;

-- Comments explaining the indexes
-- idx_polls_is_active: For filtering active polls
-- idx_polls_created_by: For user's polls queries
-- idx_polls_created_at: For ordering by creation date
-- idx_polls_active_created_at: For active polls ordered by date (most common query)
-- idx_votes_poll_id: For getting votes by poll
-- idx_votes_user_id: For getting user's votes
-- idx_votes_user_poll: For checking if user voted on specific poll
-- idx_votes_created_at: For ordering votes by date
-- idx_polls_user_active: For user's active polls (dashboard queries)
-- idx_polls_expiration: For expiration date filtering