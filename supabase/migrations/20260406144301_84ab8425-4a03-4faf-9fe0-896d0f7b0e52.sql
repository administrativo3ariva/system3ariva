ALTER TABLE public.nf_uploads
  ADD COLUMN IF NOT EXISTS supplier_cnpj text,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_cnpj text;