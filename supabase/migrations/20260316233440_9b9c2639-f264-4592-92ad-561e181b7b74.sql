
-- Create storage bucket for NF files
INSERT INTO storage.buckets (id, name, public) VALUES ('nf-files', 'nf-files', true);

-- Allow anyone to upload files to nf-files bucket
CREATE POLICY "Anyone can upload NF files"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'nf-files');

-- Allow anyone to read NF files
CREATE POLICY "Anyone can read NF files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'nf-files');

-- Allow anyone to delete NF files
CREATE POLICY "Anyone can delete NF files"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'nf-files');

-- Add file_url column to nf_uploads
ALTER TABLE public.nf_uploads ADD COLUMN IF NOT EXISTS file_url text;
