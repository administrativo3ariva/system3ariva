DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Ativo can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_ativo() OR auth.uid() = user_id);