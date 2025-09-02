-- Additional RLS policy to allow users to view their own polls regardless of active status
-- Run this in your Supabase SQL Editor after the main database-setup.sql

CREATE POLICY "Users can view their own polls" ON public.polls
  FOR SELECT USING (auth.uid()::text = created_by::text);