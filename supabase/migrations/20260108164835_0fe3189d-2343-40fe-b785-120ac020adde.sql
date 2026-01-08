-- Drop dependent policies first
DROP POLICY IF EXISTS "Admins can update their salon" ON public.salons;
DROP POLICY IF EXISTS "Admins can manage professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'professional');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Now we can safely remove role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's salon_id safely
CREATE OR REPLACE FUNCTION public.get_user_salon_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT salon_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS policy for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Recreate policies with new functions
CREATE POLICY "Admins can update their salon" ON public.salons
  FOR UPDATE USING (id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert professionals" ON public.professionals
  FOR INSERT WITH CHECK (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can update professionals" ON public.professionals
  FOR UPDATE USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can delete professionals" ON public.professionals
  FOR DELETE USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert services" ON public.services
  FOR INSERT WITH CHECK (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can update services" ON public.services
  FOR UPDATE USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can delete services" ON public.services
  FOR DELETE USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));