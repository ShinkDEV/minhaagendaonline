-- Create table for free trial invitations (unlimited time)
CREATE TABLE public.free_trial_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    activated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.free_trial_users ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage free trial invitations
CREATE POLICY "Super admins can manage free trials"
ON public.free_trial_users
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Allow checking free trial status for authenticated users (to check their own status)
CREATE POLICY "Users can view their own free trial"
ON public.free_trial_users
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));