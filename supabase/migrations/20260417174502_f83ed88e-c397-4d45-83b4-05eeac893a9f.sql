-- Templates de despesas recorrentes mensais
CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch text NOT NULL,
  macrobloco text NOT NULL DEFAULT 'Ocupação e Infraestrutura',
  category text NOT NULL,
  description text NOT NULL,
  supplier text,
  supplier_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  due_day integer NOT NULL DEFAULT 5 CHECK (due_day BETWEEN 1 AND 31),
  company text NOT NULL,
  cost_center text NOT NULL,
  payment_method text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recurring_expenses" ON public.recurring_expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recurring_expenses" ON public.recurring_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recurring_expenses" ON public.recurring_expenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete recurring_expenses" ON public.recurring_expenses FOR DELETE USING (true);

CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_recurring_expenses_active ON public.recurring_expenses(active, branch, category);

-- Registro de gerações mensais (evita duplicação)
CREATE TABLE public.recurring_expense_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id uuid NOT NULL REFERENCES public.recurring_expenses(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  payment_request_id uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recurring_expense_id, year, month)
);

ALTER TABLE public.recurring_expense_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recurring_expense_runs" ON public.recurring_expense_runs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recurring_expense_runs" ON public.recurring_expense_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recurring_expense_runs" ON public.recurring_expense_runs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete recurring_expense_runs" ON public.recurring_expense_runs FOR DELETE USING (true);