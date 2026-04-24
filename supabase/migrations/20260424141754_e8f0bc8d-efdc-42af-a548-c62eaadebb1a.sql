ALTER TABLE public.nf_items ADD COLUMN IF NOT EXISTS financial_link_type text;
ALTER TABLE public.nf_items ADD COLUMN IF NOT EXISTS category text;
CREATE POLICY "Anyone can update nf_items" ON public.nf_items FOR UPDATE USING (true);