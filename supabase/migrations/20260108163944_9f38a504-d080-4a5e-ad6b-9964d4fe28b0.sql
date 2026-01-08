-- Create salons table
CREATE TABLE public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('admin', 'professional')),
  full_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  commission_percent_default NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment_services junction table
CREATE TABLE public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price_charged NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for salons
CREATE POLICY "Users can view their salon" ON public.salons
  FOR SELECT USING (
    id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update their salon" ON public.salons
  FOR UPDATE USING (
    id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Create RLS policies for professionals (salon members can view)
CREATE POLICY "Salon members can view professionals" ON public.professionals
  FOR SELECT USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage professionals" ON public.professionals
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS policies for clients
CREATE POLICY "Salon members can view clients" ON public.clients
  FOR SELECT USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Salon members can manage clients" ON public.clients
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

-- Create RLS policies for services
CREATE POLICY "Salon members can view services" ON public.services
  FOR SELECT USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create RLS policies for appointments
CREATE POLICY "Salon members can view appointments" ON public.appointments
  FOR SELECT USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Salon members can manage appointments" ON public.appointments
  FOR ALL USING (
    salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
  );

-- Create RLS policies for appointment_services
CREATE POLICY "Salon members can view appointment services" ON public.appointment_services
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM public.appointments 
      WHERE salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Salon members can manage appointment services" ON public.appointment_services
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM public.appointments 
      WHERE salon_id IN (SELECT salon_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();