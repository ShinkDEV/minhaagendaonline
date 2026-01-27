-- Remove policies that allow all salon members to complete appointments
DROP POLICY IF EXISTS "Salon members can create cashflow entries" ON public.cashflow_entries;
DROP POLICY IF EXISTS "Salon members can create payments" ON public.payments;
DROP POLICY IF EXISTS "Salon members can create commissions" ON public.commissions;

-- Add admin-only INSERT policy for payments
CREATE POLICY "Admins can create payments"
ON public.payments
FOR INSERT
WITH CHECK (salon_id = get_user_salon_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Add admin-only INSERT policy for commissions
CREATE POLICY "Admins can create commissions"
ON public.commissions
FOR INSERT
WITH CHECK (salon_id = get_user_salon_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));