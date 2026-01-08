-- Add cancelled_at column to track when trial was cancelled
ALTER TABLE public.free_trial_users
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;