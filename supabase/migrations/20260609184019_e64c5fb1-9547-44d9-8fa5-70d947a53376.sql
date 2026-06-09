
-- 1) is_active_admin helper (additive)
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles r
    JOIN public.profiles p ON p.user_id = r.user_id
    WHERE r.user_id = auth.uid()
      AND r.role = 'admin'::app_role
      AND p.status = 'ativo'
  )
$$;

-- 2) Remove hardcoded admin email from handle_new_user (existing admin already provisioned)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    'pendente'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$$;

-- 3) Reinforce created_by ownership on INSERT/UPDATE for the 3 main transactional tables.
--    Read/Delete remain unchanged (still is_ativo()).
--    Admins (active) can still write rows on behalf of others.

-- stock_movements
DROP POLICY IF EXISTS "Ativo can insert stock_movements" ON public.stock_movements;
CREATE POLICY "Ativo can insert stock_movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);

DROP POLICY IF EXISTS "Ativo can update stock_movements" ON public.stock_movements;
CREATE POLICY "Ativo can update stock_movements"
ON public.stock_movements
FOR UPDATE
TO authenticated
USING (public.is_ativo())
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);

-- expenses
DROP POLICY IF EXISTS "Ativo can insert expenses" ON public.expenses;
CREATE POLICY "Ativo can insert expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);

DROP POLICY IF EXISTS "Ativo can update expenses" ON public.expenses;
CREATE POLICY "Ativo can update expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (public.is_ativo())
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);

-- payment_requests
DROP POLICY IF EXISTS "Ativo can insert payment_requests" ON public.payment_requests;
CREATE POLICY "Ativo can insert payment_requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);

DROP POLICY IF EXISTS "Ativo can update payment_requests" ON public.payment_requests;
CREATE POLICY "Ativo can update payment_requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (public.is_ativo())
WITH CHECK (
  public.is_ativo()
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_active_admin())
);
