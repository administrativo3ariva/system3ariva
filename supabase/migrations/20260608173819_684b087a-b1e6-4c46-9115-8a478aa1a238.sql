
-- Add created_by tracking to stock_movements, expenses, and payment_requests
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- Allow authenticated users to read profiles (name/email) of other authors
-- (needed so the detail dialog can show who created an entry)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Authenticated can view basic profile info'
  ) THEN
    CREATE POLICY "Authenticated can view basic profile info"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;
