-- Create table to store FAQ feedback
CREATE TABLE public.faq_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create feedback
CREATE POLICY "Authenticated users can create feedback"
ON public.faq_feedback
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.faq_feedback
FOR SELECT
USING (user_id = auth.uid());

-- Allow super admins to view all feedback
CREATE POLICY "Super admins can view all feedback"
ON public.faq_feedback
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Create index for faster lookups
CREATE INDEX idx_faq_feedback_faq_id ON public.faq_feedback(faq_id);
CREATE INDEX idx_faq_feedback_user_id ON public.faq_feedback(user_id);