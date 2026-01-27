-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Professionals can view their clients" ON public.clients;

-- Create a more secure policy that restricts access to ACTIVE professionals within the same salon
-- This prevents fired/inactive professionals from accessing client data
CREATE POLICY "Active professionals can view their salon clients" 
ON public.clients 
FOR SELECT 
USING (
  (salon_id = get_user_salon_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR (
      -- Must be an ACTIVE professional in the same salon
      EXISTS (
        SELECT 1
        FROM professionals p
        WHERE p.profile_id = auth.uid()
          AND p.salon_id = clients.salon_id
          AND p.active = true
      )
    )
  )
);