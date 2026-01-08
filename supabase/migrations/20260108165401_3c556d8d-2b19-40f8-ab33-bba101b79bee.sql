-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  max_professionals INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salon_plan table
CREATE TABLE public.salon_plan (
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add address to salons
ALTER TABLE public.salons ADD COLUMN address TEXT;

-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, weekday)
);

-- Create professional_service_commissions table
CREATE TABLE public.professional_service_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_id)
);

-- Add duration_minutes to appointment_services
ALTER TABLE public.appointment_services ADD COLUMN duration_minutes INTEGER;

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('cash', 'pix', 'credit_card', 'debit_card', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commissions table
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashflow_categories table
CREATE TABLE public.cashflow_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cashflow_entries table
CREATE TABLE public.cashflow_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.cashflow_categories(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_service_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_entries ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (public info)
CREATE POLICY "Plans are publicly readable" ON public.plans
  FOR SELECT USING (true);

-- Salon plan policies
CREATE POLICY "Salon members can view their plan" ON public.salon_plan
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage salon plan" ON public.salon_plan
  FOR ALL USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Working hours policies
CREATE POLICY "Salon members can view working hours" ON public.working_hours
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage working hours" ON public.working_hours
  FOR ALL USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Professional service commissions policies
CREATE POLICY "Salon members can view commissions rules" ON public.professional_service_commissions
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage commission rules" ON public.professional_service_commissions
  FOR ALL USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Salon members can view payments" ON public.payments
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Salon members can create payments" ON public.payments
  FOR INSERT WITH CHECK (salon_id = public.get_user_salon_id(auth.uid()));

-- Commissions policies
CREATE POLICY "Salon members can view commissions" ON public.commissions
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Salon members can create commissions" ON public.commissions
  FOR INSERT WITH CHECK (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can update commissions" ON public.commissions
  FOR UPDATE USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Cashflow categories policies
CREATE POLICY "Salon members can view categories" ON public.cashflow_categories
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage categories" ON public.cashflow_categories
  FOR ALL USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Cashflow entries policies
CREATE POLICY "Salon members can view entries" ON public.cashflow_entries
  FOR SELECT USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage entries" ON public.cashflow_entries
  FOR ALL USING (salon_id = public.get_user_salon_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.plans (code, name, max_professionals) VALUES
  ('basic', 'Básico (1-2 profissionais)', 2),
  ('standard', 'Padrão (3-5 profissionais)', 5),
  ('premium', 'Premium (6-10 profissionais)', 10);

-- Insert default cashflow categories function for new salons
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cashflow_categories (salon_id, name, type) VALUES
    (NEW.id, 'Atendimentos', 'income'),
    (NEW.id, 'Produtos', 'income'),
    (NEW.id, 'Outros', 'income'),
    (NEW.id, 'Aluguel', 'expense'),
    (NEW.id, 'Produtos', 'expense'),
    (NEW.id, 'Salários', 'expense'),
    (NEW.id, 'Comissões', 'expense'),
    (NEW.id, 'Outros', 'expense');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_salon_categories
  AFTER INSERT ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();