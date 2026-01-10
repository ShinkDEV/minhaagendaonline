-- Fix: Announcements visible to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (active = true);

-- Fix: Trial invite links accessible without authentication
DROP POLICY IF EXISTS "Anyone can view active trial links" ON public.trial_invite_links;
CREATE POLICY "Authenticated users can view active trial links"
ON public.trial_invite_links
FOR SELECT
TO authenticated
USING (active = true);

-- Improvement: Allow professionals to create clients
DROP POLICY IF EXISTS "Salon admins can create clients" ON public.clients;
CREATE POLICY "Salon members can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  salon_id = public.get_user_salon_id(auth.uid()) 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'professional'::app_role)
  )
);

-- Improvement: Add UPDATE and DELETE policies for payments (admin only)
CREATE POLICY "Salon admins can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  salon_id = public.get_user_salon_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Salon admins can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (
  salon_id = public.get_user_salon_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Improvement: Add DELETE policy for appointments (admin only)
CREATE POLICY "Salon admins can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  salon_id = public.get_user_salon_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);