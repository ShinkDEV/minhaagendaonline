-- Create salon_working_hours table for salon operating hours
CREATE TABLE public.salon_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  is_open boolean NOT NULL DEFAULT true,
  start_time time without time zone NOT NULL DEFAULT '09:00',
  end_time time without time zone NOT NULL DEFAULT '18:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(salon_id, weekday)
);

-- Enable RLS
ALTER TABLE public.salon_working_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage salon working hours"
ON public.salon_working_hours
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Salon members can view salon working hours"
ON public.salon_working_hours
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));