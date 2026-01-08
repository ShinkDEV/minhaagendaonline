-- Create time_blocks table for professional time blocks
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT, -- 'daily', 'weekly', 'monthly'
  recurrence_days INTEGER[], -- for weekly: array of weekdays (0-6)
  recurrence_end_date DATE, -- when recurring ends (null = forever)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Salon members can view time blocks
CREATE POLICY "Salon members can view time blocks"
ON public.time_blocks
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));

-- Admins can manage time blocks
CREATE POLICY "Admins can manage time blocks"
ON public.time_blocks
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_time_blocks_professional ON public.time_blocks(professional_id);
CREATE INDEX idx_time_blocks_dates ON public.time_blocks(start_at, end_at);