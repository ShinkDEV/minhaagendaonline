-- Create function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create products table for stock management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_products_salon_id ON public.products(salon_id);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_products_category ON public.products(category);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING ((salon_id = get_user_salon_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Salon members can view products"
ON public.products
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));

-- Create product_movements table for stock tracking
CREATE TABLE public.product_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_product_movements_product_id ON public.product_movements(product_id);
CREATE INDEX idx_product_movements_salon_id ON public.product_movements(salon_id);
CREATE INDEX idx_product_movements_created_at ON public.product_movements(created_at);

-- Enable RLS
ALTER TABLE public.product_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for movements
CREATE POLICY "Admins can manage product movements"
ON public.product_movements
FOR ALL
USING ((salon_id = get_user_salon_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Salon members can view product movements"
ON public.product_movements
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));

-- Trigger to update product quantity on movement
CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE public.products SET quantity = quantity + NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE public.products SET quantity = quantity - NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_product_movement
AFTER INSERT ON public.product_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_quantity();

-- Trigger to update updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();