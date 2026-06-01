
-- 1. Add status column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

-- Backfill: existing profiles considered ativo
UPDATE public.profiles SET status = 'ativo' WHERE status = 'pendente' AND created_at < now() - interval '1 minute';

-- Ensure admin@sistema.com (if already exists) is admin + ativo
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sistema.com' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    UPDATE public.profiles SET status = 'ativo' WHERE user_id = admin_uid;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 2. Replace handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_email boolean := NEW.email = 'admin@sistema.com';
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    CASE WHEN is_admin_email THEN 'ativo' ELSE 'pendente' END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin_email THEN 'admin'::app_role ELSE 'user'::app_role END);
  RETURN NEW;
END;
$function$;

-- Re-create trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Admin RLS policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Allow has_role to be called by authenticated (needed for client-side admin checks via policies). Function is SECURITY DEFINER so this is safe.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 5. Admin can view/manage user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;
