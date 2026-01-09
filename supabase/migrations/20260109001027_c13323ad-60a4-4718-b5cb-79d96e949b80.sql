-- Create atomic increment function for trial link usage
CREATE OR REPLACE FUNCTION public.increment_trial_link_usage(link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE trial_invite_links 
  SET usage_count = usage_count + 1 
  WHERE id = link_id;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.increment_trial_link_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_trial_link_usage(uuid) TO anon;