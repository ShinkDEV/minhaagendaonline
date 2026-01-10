-- Allow professionals to create their own time blocks
CREATE POLICY "Professionals can create their own time blocks"
ON public.time_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  salon_id = public.get_user_salon_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = time_blocks.professional_id
    AND p.profile_id = auth.uid()
  )
);

-- Allow professionals to update their own time blocks
CREATE POLICY "Professionals can update their own time blocks"
ON public.time_blocks
FOR UPDATE
TO authenticated
USING (
  salon_id = public.get_user_salon_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = time_blocks.professional_id
    AND p.profile_id = auth.uid()
  )
);

-- Allow professionals to delete their own time blocks
CREATE POLICY "Professionals can delete their own time blocks"
ON public.time_blocks
FOR DELETE
TO authenticated
USING (
  salon_id = public.get_user_salon_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = time_blocks.professional_id
    AND p.profile_id = auth.uid()
  )
);