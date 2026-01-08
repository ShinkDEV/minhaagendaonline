-- Drop existing policy and recreate with explicit authenticated role
DROP POLICY IF EXISTS "Users can create salons during onboarding" ON public.salons;

CREATE POLICY "Allow authenticated users to create salons" 
ON public.salons 
FOR INSERT 
TO authenticated
WITH CHECK (true);