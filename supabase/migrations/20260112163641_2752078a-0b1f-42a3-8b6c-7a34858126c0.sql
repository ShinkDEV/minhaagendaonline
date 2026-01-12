-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage suppliers"
ON public.suppliers
FOR ALL
USING (salon_id = get_user_salon_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Salon members can view suppliers"
ON public.suppliers
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add supplier_id column to products table
ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;