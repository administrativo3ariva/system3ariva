ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS allocations jsonb;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS allocations jsonb;