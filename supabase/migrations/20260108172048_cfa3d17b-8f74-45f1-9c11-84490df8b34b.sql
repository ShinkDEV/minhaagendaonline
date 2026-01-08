-- Allow authenticated users to create a salon (during onboarding)
CREATE POLICY "Authenticated users can create salons" 
ON public.salons 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also need to allow insert on salon_plan
CREATE POLICY "Authenticated users can create salon plan" 
ON public.salon_plan 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to update their own profile's salon_id
CREATE POLICY "Users can update their own profile salon_id" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own role
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to create themselves as professional
CREATE POLICY "Users can create themselves as professional" 
ON public.professionals 
FOR INSERT 
TO authenticated
WITH CHECK (profile_id = auth.uid());