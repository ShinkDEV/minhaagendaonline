-- Allow super_admin to view all salons
CREATE POLICY "Super admins can view all salons" 
ON public.salons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super_admin to view all salon plans
CREATE POLICY "Super admins can view all salon plans" 
ON public.salon_plan 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super_admin to update salon plans
CREATE POLICY "Super admins can update all salon plans" 
ON public.salon_plan 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super_admin to view all professionals
CREATE POLICY "Super admins can view all professionals" 
ON public.professionals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow super_admin to view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);