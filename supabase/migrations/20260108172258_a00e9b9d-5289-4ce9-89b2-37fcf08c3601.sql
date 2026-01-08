-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;

CREATE POLICY "Authenticated users can create salons" 
ON public.salons 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Drop and recreate salon_plan policy as permissive
DROP POLICY IF EXISTS "Authenticated users can create salon plan" ON public.salon_plan;

CREATE POLICY "Authenticated users can create salon plan" 
ON public.salon_plan 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Drop and recreate user_roles policy as permissive  
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Drop and recreate professionals policy as permissive
DROP POLICY IF EXISTS "Users can create themselves as professional" ON public.professionals;

CREATE POLICY "Users can create themselves as professional" 
ON public.professionals 
FOR INSERT 
TO authenticated
WITH CHECK (profile_id = auth.uid());