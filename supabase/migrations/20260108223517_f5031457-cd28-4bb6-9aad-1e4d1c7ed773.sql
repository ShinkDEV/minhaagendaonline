-- Fix the free_trial_users policy to use user_id instead of email matching
-- This prevents email enumeration attacks

DROP POLICY IF EXISTS "Users can view their own free trial" ON public.free_trial_users;

-- Create a more secure policy using user_id
CREATE POLICY "Users can view their own free trial"
ON public.free_trial_users
FOR SELECT
USING (
  -- User can only see their own record by user_id (not email)
  user_id = auth.uid()
);