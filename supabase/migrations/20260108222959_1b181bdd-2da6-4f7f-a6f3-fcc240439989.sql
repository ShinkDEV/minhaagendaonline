-- Drop existing overly permissive policies on appointments table
DROP POLICY IF EXISTS "Salon members can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Salon members can view appointments" ON public.appointments;

-- Admins can do everything with appointments
CREATE POLICY "Admins can manage appointments"
ON public.appointments
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Professionals can only view their own appointments
CREATE POLICY "Professionals can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  salon_id = get_user_salon_id(auth.uid())
  AND (
    -- User is admin (can see all)
    has_role(auth.uid(), 'admin')
    OR
    -- User is the professional assigned to this appointment
    EXISTS (
      SELECT 1 
      FROM professionals p
      WHERE p.id = appointments.professional_id
        AND p.profile_id = auth.uid()
    )
  )
);

-- Professionals can create appointments for themselves
CREATE POLICY "Professionals can create their own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  salon_id = get_user_salon_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin')
    OR
    EXISTS (
      SELECT 1 
      FROM professionals p
      WHERE p.id = professional_id
        AND p.profile_id = auth.uid()
    )
  )
);

-- Professionals can update their own appointments
CREATE POLICY "Professionals can update their own appointments"
ON public.appointments
FOR UPDATE
USING (
  salon_id = get_user_salon_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin')
    OR
    EXISTS (
      SELECT 1 
      FROM professionals p
      WHERE p.id = appointments.professional_id
        AND p.profile_id = auth.uid()
    )
  )
);