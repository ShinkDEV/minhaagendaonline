-- Add trial_days column to trial_invite_links
ALTER TABLE public.trial_invite_links
ADD COLUMN trial_days integer NOT NULL DEFAULT 14;

-- Add trial_days column to free_trial_users to store the period when registered
ALTER TABLE public.free_trial_users
ADD COLUMN trial_days integer;

-- Add comment for documentation
COMMENT ON COLUMN public.trial_invite_links.trial_days IS 'Number of days for the trial period';
COMMENT ON COLUMN public.free_trial_users.trial_days IS 'Number of days for the trial period (copied from invite link at registration)';