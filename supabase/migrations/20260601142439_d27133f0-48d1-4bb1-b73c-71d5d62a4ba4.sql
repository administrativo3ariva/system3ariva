
-- Replace nf-files storage policies with is_ativo() gated versions
DROP POLICY IF EXISTS "Authenticated upload NF files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read NF files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update nf-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete NF files" ON storage.objects;

CREATE POLICY "Ativo upload NF files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nf-files' AND public.is_ativo());

CREATE POLICY "Ativo read NF files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'nf-files' AND public.is_ativo());

CREATE POLICY "Ativo update NF files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'nf-files' AND public.is_ativo())
  WITH CHECK (bucket_id = 'nf-files' AND public.is_ativo());

CREATE POLICY "Ativo delete NF files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nf-files' AND public.is_ativo());

-- Revoke anon EXECUTE on SECURITY DEFINER helpers; keep authenticated access
REVOKE ALL ON FUNCTION public.is_ativo() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ativo() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
