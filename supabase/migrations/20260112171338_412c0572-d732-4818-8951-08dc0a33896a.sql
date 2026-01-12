-- Add new columns to professionals table
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT,
ADD COLUMN IF NOT EXISTS can_delete_appointments BOOLEAN NOT NULL DEFAULT false;

-- Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_professionals_cpf ON public.professionals(cpf) WHERE cpf IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.professionals.legal_name IS 'Nome conforme documento oficial';
COMMENT ON COLUMN public.professionals.cpf IS 'CPF do profissional';
COMMENT ON COLUMN public.professionals.position IS 'Cargo do profissional';
COMMENT ON COLUMN public.professionals.can_delete_appointments IS 'Permissão para excluir agendamentos';