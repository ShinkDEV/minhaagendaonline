-- Fix the invitations table policy to prevent email harvesting
-- Remove the overly permissive policy

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a security definer function to get invitation by token
-- This prevents direct table access while still allowing token-based lookup
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  salon_id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  salon_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.salon_id,
    i.email,
    i.role,
    i.status,
    i.expires_at,
    s.name as salon_name
  FROM invitations i
  LEFT JOIN salons s ON s.id = i.salon_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon;