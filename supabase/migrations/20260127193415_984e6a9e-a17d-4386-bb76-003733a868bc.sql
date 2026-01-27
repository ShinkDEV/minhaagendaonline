-- Drop the problematic public SELECT policies
DROP POLICY IF EXISTS "Anyone can read active links" ON public.trial_invite_links;
DROP POLICY IF EXISTS "Authenticated users can view active trial links" ON public.trial_invite_links;

-- Create a SECURITY DEFINER function to validate a specific code
-- This prevents listing all codes but allows validating a known code
CREATE OR REPLACE FUNCTION public.validate_trial_invite_code(_code text)
RETURNS TABLE(
  id uuid,
  code text,
  trial_days integer,
  active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    til.id,
    til.code,
    til.trial_days,
    til.active
  FROM public.trial_invite_links til
  WHERE til.code = _code
    AND til.active = true
  LIMIT 1;
$$;