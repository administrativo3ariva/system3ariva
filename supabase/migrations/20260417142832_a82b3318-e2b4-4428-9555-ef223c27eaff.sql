-- Tabela de orçamentos operacionais (anual com divisão mensal)
CREATE TABLE public.operational_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch TEXT NOT NULL,
  macrobloco TEXT NOT NULL,
  category TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 2026,
  annual_amount NUMERIC NOT NULL DEFAULT 0,
  jan_amount NUMERIC NOT NULL DEFAULT 0,
  feb_amount NUMERIC NOT NULL DEFAULT 0,
  mar_amount NUMERIC NOT NULL DEFAULT 0,
  apr_amount NUMERIC NOT NULL DEFAULT 0,
  may_amount NUMERIC NOT NULL DEFAULT 0,
  jun_amount NUMERIC NOT NULL DEFAULT 0,
  jul_amount NUMERIC NOT NULL DEFAULT 0,
  aug_amount NUMERIC NOT NULL DEFAULT 0,
  sep_amount NUMERIC NOT NULL DEFAULT 0,
  oct_amount NUMERIC NOT NULL DEFAULT 0,
  nov_amount NUMERIC NOT NULL DEFAULT 0,
  dec_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch, macrobloco, category, year)
);

ALTER TABLE public.operational_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read operational_budgets" ON public.operational_budgets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert operational_budgets" ON public.operational_budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update operational_budgets" ON public.operational_budgets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete operational_budgets" ON public.operational_budgets FOR DELETE USING (true);

CREATE TRIGGER update_operational_budgets_updated_at
BEFORE UPDATE ON public.operational_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de despesas operacionais (lançamentos exclusivos)
CREATE TABLE public.operational_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  branch TEXT NOT NULL,
  macrobloco TEXT NOT NULL,
  category TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT,
  supplier_id UUID,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.operational_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read operational_expenses" ON public.operational_expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert operational_expenses" ON public.operational_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update operational_expenses" ON public.operational_expenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete operational_expenses" ON public.operational_expenses FOR DELETE USING (true);

CREATE TRIGGER update_operational_expenses_updated_at
BEFORE UPDATE ON public.operational_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_operational_budgets_lookup ON public.operational_budgets(branch, year, macrobloco, category);
CREATE INDEX idx_operational_expenses_lookup ON public.operational_expenses(branch, expense_date, category);