-- Fix salons table to restrict SELECT to authenticated salon members only
-- Drop existing SELECT policies and recreate with proper authentication

DROP POLICY IF EXISTS "Users can view their salon" ON public.salons;
DROP POLICY IF EXISTS "Super admins can view all salons" ON public.salons;

-- Recreate policies for authenticated users only
CREATE POLICY "Salon members can view their salon"
ON public.salons
FOR SELECT
TO authenticated
USING (id = get_user_salon_id(auth.uid()));

CREATE POLICY "Super admins can view all salons"
ON public.salons
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));