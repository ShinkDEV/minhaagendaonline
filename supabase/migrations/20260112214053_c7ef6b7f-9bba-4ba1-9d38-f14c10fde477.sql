-- Allow unauthenticated users to insert their own trial registration
CREATE POLICY "Allow trial registration insert"
ON public.free_trial_users
FOR INSERT
WITH CHECK (true);

-- Note: This is safe because the table only stores email and trial info
-- The actual user setup (salon, admin role) is done via edge function with service role