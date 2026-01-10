-- Create appointment_logs table to track all changes
CREATE TABLE public.appointment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'created', 'updated', 'status_changed', 'cancelled'
  changes jsonb, -- stores what was changed
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_logs ENABLE ROW LEVEL SECURITY;

-- Policies: salon members can view logs, anyone in salon can create logs
CREATE POLICY "Salon members can view appointment logs"
ON public.appointment_logs
FOR SELECT
USING (
  appointment_id IN (
    SELECT id FROM appointments 
    WHERE salon_id = get_user_salon_id(auth.uid())
  )
);

CREATE POLICY "Salon members can create appointment logs"
ON public.appointment_logs
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  appointment_id IN (
    SELECT id FROM appointments 
    WHERE salon_id = get_user_salon_id(auth.uid())
  )
);

-- Create index for faster queries
CREATE INDEX idx_appointment_logs_appointment_id ON public.appointment_logs(appointment_id);
CREATE INDEX idx_appointment_logs_created_at ON public.appointment_logs(created_at DESC);