-- Remove single card_fee_percent and add installment-based card fees
-- Add JSON column to store card fees per installment (1x to 12x)
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS card_fees_by_installment JSONB NOT NULL DEFAULT '{
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
  "6": 0,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": 0,
  "11": 0,
  "12": 0
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.salons.card_fees_by_installment IS 'Percentuais de taxa de cartão por quantidade de parcelas (1x a 12x)';