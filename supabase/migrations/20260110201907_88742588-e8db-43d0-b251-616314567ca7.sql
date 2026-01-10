-- Create a function to get professionals with their linked user email
CREATE OR REPLACE FUNCTION public.get_professionals_with_email(p_salon_id uuid)
RETURNS TABLE (
  id uuid,
  salon_id uuid,
  profile_id uuid,
  display_name text,
  commission_percent_default numeric,
  active boolean,
  created_at timestamptz,
  user_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.salon_id,
    p.profile_id,
    p.display_name,
    p.commission_percent_default,
    p.active,
    p.created_at,
    u.email as user_email
  FROM public.professionals p
  LEFT JOIN auth.users u ON u.id = p.profile_id
  WHERE p.salon_id = p_salon_id
  ORDER BY p.display_name;
$$;