-- Create table for invite links (reusable trial links)
CREATE TABLE public.trial_invite_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.trial_invite_links ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage invite links
CREATE POLICY "Super admins can manage invite links"
  ON public.trial_invite_links
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Anyone can read active links (needed for signup flow)
CREATE POLICY "Anyone can read active links"
  ON public.trial_invite_links
  FOR SELECT
  USING (active = true);

-- Add invited_by column to free_trial_users to track which link was used
ALTER TABLE public.free_trial_users
  ADD COLUMN IF NOT EXISTS invite_link_id UUID REFERENCES public.trial_invite_links(id);