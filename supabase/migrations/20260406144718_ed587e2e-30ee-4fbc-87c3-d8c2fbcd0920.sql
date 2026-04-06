ALTER TABLE public.nf_uploads RENAME COLUMN recipient_cnpj TO recipient_doc;
ALTER TABLE public.nf_uploads ADD COLUMN IF NOT EXISTS recipient_doc_type text;