
-- Helper: drop and recreate auth-only policies for a list of tables
-- Tables to restrict to authenticated users for all CRUD

-- COLLABORATORS
DROP POLICY IF EXISTS "Anyone can read collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Anyone can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Anyone can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Anyone can delete collaborators" ON public.collaborators;
CREATE POLICY "Authenticated can read collaborators" ON public.collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert collaborators" ON public.collaborators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update collaborators" ON public.collaborators FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete collaborators" ON public.collaborators FOR DELETE TO authenticated USING (true);

-- EXPENSES
DROP POLICY IF EXISTS "Anyone can read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can delete expenses" ON public.expenses;
CREATE POLICY "Authenticated can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- NF_UPLOADS
DROP POLICY IF EXISTS "Anyone can read nf_uploads" ON public.nf_uploads;
DROP POLICY IF EXISTS "Anyone can insert nf_uploads" ON public.nf_uploads;
DROP POLICY IF EXISTS "Anyone can update nf_uploads" ON public.nf_uploads;
DROP POLICY IF EXISTS "Anyone can delete nf_uploads" ON public.nf_uploads;
CREATE POLICY "Authenticated can read nf_uploads" ON public.nf_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert nf_uploads" ON public.nf_uploads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update nf_uploads" ON public.nf_uploads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete nf_uploads" ON public.nf_uploads FOR DELETE TO authenticated USING (true);

-- NF_ITEMS
DROP POLICY IF EXISTS "Anyone can read nf_items" ON public.nf_items;
DROP POLICY IF EXISTS "Anyone can insert nf_items" ON public.nf_items;
DROP POLICY IF EXISTS "Anyone can update nf_items" ON public.nf_items;
DROP POLICY IF EXISTS "Anyone can delete nf_items" ON public.nf_items;
CREATE POLICY "Authenticated can read nf_items" ON public.nf_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert nf_items" ON public.nf_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update nf_items" ON public.nf_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete nf_items" ON public.nf_items FOR DELETE TO authenticated USING (true);

-- PAYMENT_REQUESTS
DROP POLICY IF EXISTS "Anyone can read payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Anyone can insert payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Anyone can update payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Anyone can delete payment_requests" ON public.payment_requests;
CREATE POLICY "Authenticated can read payment_requests" ON public.payment_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert payment_requests" ON public.payment_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payment_requests" ON public.payment_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete payment_requests" ON public.payment_requests FOR DELETE TO authenticated USING (true);

-- RECURRING_EXPENSE_RUNS
DROP POLICY IF EXISTS "Anyone can read recurring_expense_runs" ON public.recurring_expense_runs;
DROP POLICY IF EXISTS "Anyone can insert recurring_expense_runs" ON public.recurring_expense_runs;
DROP POLICY IF EXISTS "Anyone can update recurring_expense_runs" ON public.recurring_expense_runs;
DROP POLICY IF EXISTS "Anyone can delete recurring_expense_runs" ON public.recurring_expense_runs;
CREATE POLICY "Authenticated can read recurring_expense_runs" ON public.recurring_expense_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert recurring_expense_runs" ON public.recurring_expense_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update recurring_expense_runs" ON public.recurring_expense_runs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete recurring_expense_runs" ON public.recurring_expense_runs FOR DELETE TO authenticated USING (true);

-- RECURRING_EXPENSES
DROP POLICY IF EXISTS "Anyone can read recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Anyone can insert recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Anyone can update recurring_expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Anyone can delete recurring_expenses" ON public.recurring_expenses;
CREATE POLICY "Authenticated can read recurring_expenses" ON public.recurring_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert recurring_expenses" ON public.recurring_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update recurring_expenses" ON public.recurring_expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete recurring_expenses" ON public.recurring_expenses FOR DELETE TO authenticated USING (true);

-- SUPPLIERS
DROP POLICY IF EXISTS "Anyone can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can delete suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- ASSETS
DROP POLICY IF EXISTS "Anyone can read assets" ON public.assets;
DROP POLICY IF EXISTS "Anyone can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Anyone can update assets" ON public.assets;
DROP POLICY IF EXISTS "Anyone can delete assets" ON public.assets;
CREATE POLICY "Authenticated can read assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update assets" ON public.assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete assets" ON public.assets FOR DELETE TO authenticated USING (true);

-- MAINTENANCE_TASKS
DROP POLICY IF EXISTS "Anyone can read maintenance_tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Anyone can insert maintenance_tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Anyone can update maintenance_tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Anyone can delete maintenance_tasks" ON public.maintenance_tasks;
CREATE POLICY "Authenticated can read maintenance_tasks" ON public.maintenance_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert maintenance_tasks" ON public.maintenance_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update maintenance_tasks" ON public.maintenance_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete maintenance_tasks" ON public.maintenance_tasks FOR DELETE TO authenticated USING (true);

-- OPERATIONAL_BUDGETS_MONTHLY
DROP POLICY IF EXISTS "Anyone can read operational_budgets_monthly" ON public.operational_budgets_monthly;
DROP POLICY IF EXISTS "Anyone can insert operational_budgets_monthly" ON public.operational_budgets_monthly;
DROP POLICY IF EXISTS "Anyone can update operational_budgets_monthly" ON public.operational_budgets_monthly;
DROP POLICY IF EXISTS "Anyone can delete operational_budgets_monthly" ON public.operational_budgets_monthly;
CREATE POLICY "Authenticated can read operational_budgets_monthly" ON public.operational_budgets_monthly FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert operational_budgets_monthly" ON public.operational_budgets_monthly FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update operational_budgets_monthly" ON public.operational_budgets_monthly FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete operational_budgets_monthly" ON public.operational_budgets_monthly FOR DELETE TO authenticated USING (true);

-- OPERATIONAL_EXPENSES
DROP POLICY IF EXISTS "Anyone can read operational_expenses" ON public.operational_expenses;
DROP POLICY IF EXISTS "Anyone can insert operational_expenses" ON public.operational_expenses;
DROP POLICY IF EXISTS "Anyone can update operational_expenses" ON public.operational_expenses;
DROP POLICY IF EXISTS "Anyone can delete operational_expenses" ON public.operational_expenses;
CREATE POLICY "Authenticated can read operational_expenses" ON public.operational_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert operational_expenses" ON public.operational_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update operational_expenses" ON public.operational_expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete operational_expenses" ON public.operational_expenses FOR DELETE TO authenticated USING (true);

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
CREATE POLICY "Authenticated can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete products" ON public.products FOR DELETE TO authenticated USING (true);

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Anyone can read movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can insert movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can update movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Anyone can delete movements" ON public.stock_movements;
CREATE POLICY "Authenticated can read movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update movements" ON public.stock_movements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete movements" ON public.stock_movements FOR DELETE TO authenticated USING (true);

-- Revoke anon grants from public schema tables so policies are the only gate
REVOKE ALL ON public.collaborators, public.expenses, public.nf_uploads, public.nf_items,
  public.payment_requests, public.recurring_expense_runs, public.recurring_expenses,
  public.suppliers, public.assets, public.maintenance_tasks,
  public.operational_budgets_monthly, public.operational_expenses,
  public.products, public.stock_movements FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.collaborators, public.expenses, public.nf_uploads, public.nf_items,
  public.payment_requests, public.recurring_expense_runs, public.recurring_expenses,
  public.suppliers, public.assets, public.maintenance_tasks,
  public.operational_budgets_monthly, public.operational_expenses,
  public.products, public.stock_movements TO authenticated;

-- Storage: add UPDATE policy restricting file replacement to authenticated users
CREATE POLICY "Authenticated can update nf-files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'nf-files') WITH CHECK (bucket_id = 'nf-files');

CREATE POLICY "Authenticated can update asset-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images') WITH CHECK (bucket_id = 'asset-images');

-- Restrict SECURITY DEFINER functions: handle_new_user is only used by trigger, update_product_quantity by trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_product_quantity() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
