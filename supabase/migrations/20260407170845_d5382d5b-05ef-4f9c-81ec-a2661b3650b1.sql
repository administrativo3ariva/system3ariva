
-- Create expenses table (corporate card expenses)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  cost_center TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  card_name TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_requests table
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  cost_center TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT,
  due_date DATE,
  payment_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payment_requests" ON public.payment_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payment_requests" ON public.payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payment_requests" ON public.payment_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payment_requests" ON public.payment_requests FOR DELETE USING (true);

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
