
ALTER TABLE public.expenses ADD COLUMN supplier text;
ALTER TABLE public.expenses ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id);
