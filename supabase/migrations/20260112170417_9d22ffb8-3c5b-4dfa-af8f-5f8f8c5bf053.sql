-- Add new columns to clients table
ALTER TABLE public.clients 
ADD COLUMN birth_date date,
ADD COLUMN gender text,
ADD COLUMN cpf text,
ADD COLUMN rg text,
ADD COLUMN credit_balance numeric NOT NULL DEFAULT 0;

-- Add index for CPF (commonly searched)
CREATE INDEX idx_clients_cpf ON public.clients(cpf) WHERE cpf IS NOT NULL;

-- Create credit movements table to track credit/debit history
CREATE TABLE public.client_credit_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_credit_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit movements
CREATE POLICY "Admins can manage credit movements"
ON public.client_credit_movements
FOR ALL
USING (
  salon_id = get_user_salon_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Salon members can view credit movements"
ON public.client_credit_movements
FOR SELECT
USING (salon_id = get_user_salon_id(auth.uid()));

-- Create trigger to update client credit_balance on movement insert
CREATE OR REPLACE FUNCTION public.update_client_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'credit' THEN
    UPDATE public.clients SET credit_balance = credit_balance + NEW.amount WHERE id = NEW.client_id;
  ELSIF NEW.type = 'debit' THEN
    UPDATE public.clients SET credit_balance = credit_balance - NEW.amount WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_credit_balance_on_movement
AFTER INSERT ON public.client_credit_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_client_credit_balance();