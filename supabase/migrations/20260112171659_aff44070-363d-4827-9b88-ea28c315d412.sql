-- Add commission configuration to salons table
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS card_fee_percent NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_fee_percent NUMERIC NOT NULL DEFAULT 0;

-- Add detailed fields to commissions table
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS gross_amount NUMERIC,
ADD COLUMN IF NOT EXISTS card_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.salons.card_fee_percent IS 'Percentual de taxa de cartão a ser descontado das comissões';
COMMENT ON COLUMN public.salons.admin_fee_percent IS 'Percentual de taxa administrativa a ser descontado das comissões';
COMMENT ON COLUMN public.commissions.gross_amount IS 'Valor bruto da comissão antes dos descontos';
COMMENT ON COLUMN public.commissions.card_fee_amount IS 'Valor descontado referente à taxa de cartão';
COMMENT ON COLUMN public.commissions.admin_fee_amount IS 'Valor descontado referente à taxa administrativa';