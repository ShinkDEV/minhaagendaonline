-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow trial registration insert" ON public.free_trial_users;

-- Create a more restrictive policy that validates the invite_link_id exists and is active
CREATE POLICY "Allow trial registration with valid link"
ON public.free_trial_users
FOR INSERT
WITH CHECK (
  invite_link_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.trial_invite_links 
    WHERE id = invite_link_id 
    AND active = true
  )
);