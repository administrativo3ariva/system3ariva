-- Create new monthly budget table
CREATE TABLE public.operational_budgets_monthly (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  branch TEXT NOT NULL,
  macrobloco TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operational_budgets_monthly_unique UNIQUE (year, month, branch, macrobloco, category)
);

CREATE INDEX idx_op_budgets_monthly_year_month ON public.operational_budgets_monthly(year, month);
CREATE INDEX idx_op_budgets_monthly_branch ON public.operational_budgets_monthly(branch);

ALTER TABLE public.operational_budgets_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read operational_budgets_monthly" ON public.operational_budgets_monthly FOR SELECT USING (true);
CREATE POLICY "Anyone can insert operational_budgets_monthly" ON public.operational_budgets_monthly FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update operational_budgets_monthly" ON public.operational_budgets_monthly FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete operational_budgets_monthly" ON public.operational_budgets_monthly FOR DELETE USING (true);

CREATE TRIGGER update_op_budgets_monthly_updated_at
BEFORE UPDATE ON public.operational_budgets_monthly
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate data from old table (one row per month per combination)
INSERT INTO public.operational_budgets_monthly (year, month, branch, macrobloco, category, amount)
SELECT year, m.month_num, branch, macrobloco, category,
  CASE m.month_num
    WHEN 1 THEN jan_amount WHEN 2 THEN feb_amount WHEN 3 THEN mar_amount
    WHEN 4 THEN apr_amount WHEN 5 THEN may_amount WHEN 6 THEN jun_amount
    WHEN 7 THEN jul_amount WHEN 8 THEN aug_amount WHEN 9 THEN sep_amount
    WHEN 10 THEN oct_amount WHEN 11 THEN nov_amount WHEN 12 THEN dec_amount
  END
FROM public.operational_budgets b
CROSS JOIN (SELECT generate_series(1,12) AS month_num) m
ON CONFLICT (year, month, branch, macrobloco, category) DO NOTHING;

-- Drop old anual table
DROP TABLE public.operational_budgets;

-- Fix FLO -> FLN label in operational_expenses if any
UPDATE public.operational_expenses SET branch = 'FLN' WHERE branch = 'FLO';