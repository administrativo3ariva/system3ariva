
-- 1) Helper: is the caller an approved (ativo) user?
CREATE OR REPLACE FUNCTION public.is_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
$$;

-- 2) Replace USING(true) policies on business tables with is_ativo() gate
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'assets','collaborators','expenses','maintenance_tasks',
    'nf_items','nf_uploads','operational_budgets_monthly',
    'operational_expenses','payment_requests','products',
    'recurring_expense_runs','recurring_expenses','stock_movements','suppliers'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can read %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can read movements" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert movements" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update movements" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete movements" ON public.%I', t);

    EXECUTE format('CREATE POLICY "Ativo can read %s" ON public.%I FOR SELECT TO authenticated USING (public.is_ativo())', t, t);
    EXECUTE format('CREATE POLICY "Ativo can insert %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_ativo())', t, t);
    EXECUTE format('CREATE POLICY "Ativo can update %s" ON public.%I FOR UPDATE TO authenticated USING (public.is_ativo()) WITH CHECK (public.is_ativo())', t, t);
    EXECUTE format('CREATE POLICY "Ativo can delete %s" ON public.%I FOR DELETE TO authenticated USING (public.is_ativo())', t, t);
  END LOOP;
END $$;

-- 3) Prevent self-escalation of status on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = (SELECT p.status FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 4) Make nf-files bucket private and require auth to read
UPDATE storage.buckets SET public = false WHERE id = 'nf-files';

DROP POLICY IF EXISTS "Anyone can read NF files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read NF files" ON storage.objects;

CREATE POLICY "Authenticated read NF files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nf-files');
