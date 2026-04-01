
-- nf_items: add unit_of_measure, change quantity to numeric
ALTER TABLE public.nf_items ADD COLUMN IF NOT EXISTS unit_of_measure text DEFAULT 'UN';
ALTER TABLE public.nf_items ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- products: add unit_of_measure, change quantity to numeric
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_of_measure text DEFAULT 'UN';
ALTER TABLE public.products ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- stock_movements: add unit_of_measure, change quantity to numeric
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS unit_of_measure text DEFAULT 'UN';
ALTER TABLE public.stock_movements ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- nf_uploads: add freight and other expenses
ALTER TABLE public.nf_uploads ADD COLUMN IF NOT EXISTS freight_value numeric DEFAULT 0;
ALTER TABLE public.nf_uploads ADD COLUMN IF NOT EXISTS other_expenses numeric DEFAULT 0;
