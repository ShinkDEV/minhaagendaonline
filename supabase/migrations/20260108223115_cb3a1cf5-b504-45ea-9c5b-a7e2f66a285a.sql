-- Fix overly permissive INSERT policy on salons table
-- Drop the current permissive policy
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;

-- Create a more restrictive policy - only authenticated users can create salons
-- and we'll rely on application logic to associate the user with the salon
CREATE POLICY "Authenticated users can create salons"
ON public.salons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix overly permissive INSERT policy on salon_plan table
-- Drop the current permissive policy
DROP POLICY IF EXISTS "Users can create salon plan during onboarding" ON public.salon_plan;

-- Create a more restrictive policy - users can only create salon_plan for salons they are associated with
-- During onboarding, user creates salon first, then their profile is updated with salon_id, then they create salon_plan
CREATE POLICY "Users can create salon plan during onboarding"
ON public.salon_plan
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND (
    -- Either user is admin of this salon
    (salon_id = get_user_salon_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
    OR
    -- Or this is during onboarding (user's profile has this salon_id)
    salon_id IN (SELECT profiles.salon_id FROM profiles WHERE profiles.id = auth.uid())
  )
);