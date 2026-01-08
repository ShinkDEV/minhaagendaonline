-- Drop and recreate the salon insert policy to be more permissive
DROP POLICY IF EXISTS "Allow authenticated users to create salons" ON public.salons;

CREATE POLICY "Authenticated users can create salons" 
ON public.salons 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure the professionals policy allows during onboarding
DROP POLICY IF EXISTS "Users can create themselves as professional" ON public.professionals;

CREATE POLICY "Users can create themselves as professional" 
ON public.professionals 
FOR INSERT 
TO authenticated
WITH CHECK (profile_id = auth.uid());