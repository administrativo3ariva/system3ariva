ALTER TABLE public.expenses
ADD COLUMN is_installment boolean NOT NULL DEFAULT false,
ADD COLUMN installment_count integer DEFAULT NULL,
ADD COLUMN installment_current integer DEFAULT NULL;