INSERT INTO storage.buckets (id, name, public) VALUES ('asset-images', 'asset-images', true);

CREATE POLICY "Anyone can upload asset images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'asset-images');

CREATE POLICY "Anyone can read asset images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'asset-images');

CREATE POLICY "Anyone can delete asset images"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'asset-images');