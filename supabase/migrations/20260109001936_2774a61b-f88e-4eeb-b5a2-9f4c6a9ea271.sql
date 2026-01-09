-- Fix commissions table to restrict SELECT access
-- Professionals can only see their own commissions, admins can see all

DROP POLICY IF EXISTS "Salon members can view commissions" ON public.commissions;

-- Admins can view all commissions in their salon
CREATE POLICY "Admins can view all commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Professionals can only view their own commissions
CREATE POLICY "Professionals can view own commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND professional_id IN (
    SELECT id FROM professionals WHERE profile_id = auth.uid()
  )
);