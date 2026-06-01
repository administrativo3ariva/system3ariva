
-- Storage: replace anonymous policies with authenticated-only for write ops
DROP POLICY IF EXISTS "Anyone can upload NF files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete NF files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload asset images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete asset images" ON storage.objects;

CREATE POLICY "Authenticated upload NF files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nf-files');

CREATE POLICY "Authenticated delete NF files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nf-files');

CREATE POLICY "Authenticated upload asset images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-images');

CREATE POLICY "Authenticated delete asset images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'asset-images');

-- Revoke EXECUTE on internal SECURITY DEFINER functions from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_quantity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
