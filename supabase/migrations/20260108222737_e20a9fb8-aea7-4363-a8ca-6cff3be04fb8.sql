-- Drop existing overly permissive policies on clients table
DROP POLICY IF EXISTS "Salon members can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Salon members can view clients" ON public.clients;

-- Admins can do everything with clients
CREATE POLICY "Admins can manage clients"
ON public.clients
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Professionals can only view clients they have appointments with
CREATE POLICY "Professionals can view their clients"
ON public.clients
FOR SELECT
USING (
  salon_id = get_user_salon_id(auth.uid())
  AND (
    -- User is admin (can see all)
    has_role(auth.uid(), 'admin')
    OR
    -- User is a professional who has appointments with this client
    EXISTS (
      SELECT 1 
      FROM appointments a
      INNER JOIN professionals p ON p.id = a.professional_id
      WHERE a.client_id = clients.id
        AND p.profile_id = auth.uid()
    )
  )
);