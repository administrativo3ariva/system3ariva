
-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj_cpf TEXT,
  payment_method TEXT, -- boleto, pix, transferencia
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT, -- corrente, poupanca
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete suppliers" ON public.suppliers FOR DELETE USING (true);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment fields to payment_requests
ALTER TABLE public.payment_requests
  ADD COLUMN payment_method TEXT,
  ADD COLUMN pix_key TEXT,
  ADD COLUMN bank_name TEXT,
  ADD COLUMN bank_agency TEXT,
  ADD COLUMN bank_account TEXT,
  ADD COLUMN bank_account_type TEXT,
  ADD COLUMN boleto_url TEXT,
  ADD COLUMN receipt_url TEXT,
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);
