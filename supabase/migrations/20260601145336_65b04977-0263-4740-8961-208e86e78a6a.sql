DROP POLICY IF EXISTS "Authenticated upload asset images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update asset-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete asset images" ON storage.objects;

CREATE POLICY "Ativo upload asset images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images' AND public.is_ativo());

CREATE POLICY "Ativo update asset images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-images' AND public.is_ativo())
  WITH CHECK (bucket_id = 'asset-images' AND public.is_ativo());

CREATE POLICY "Ativo delete asset images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'asset-images' AND public.is_ativo());