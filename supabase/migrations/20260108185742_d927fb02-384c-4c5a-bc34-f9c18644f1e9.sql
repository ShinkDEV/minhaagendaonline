-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_role CHECK (role IN ('professional', 'admin')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Create unique index on token
CREATE UNIQUE INDEX invitations_token_idx ON public.invitations(token);

-- Create index for lookups
CREATE INDEX invitations_salon_id_idx ON public.invitations(salon_id);
CREATE INDEX invitations_email_idx ON public.invitations(email);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations for their salon
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.invitations
FOR SELECT
USING (true);