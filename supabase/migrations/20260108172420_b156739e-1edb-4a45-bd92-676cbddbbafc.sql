-- Drop and recreate with public role instead of authenticated
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;

CREATE POLICY "Users can create salons during onboarding" 
ON public.salons 
FOR INSERT 
WITH CHECK (true);

-- Same for salon_plan
DROP POLICY IF EXISTS "Authenticated users can create salon plan" ON public.salon_plan;

CREATE POLICY "Users can create salon plan during onboarding" 
ON public.salon_plan 
FOR INSERT 
WITH CHECK (true);