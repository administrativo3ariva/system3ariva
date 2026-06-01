
-- Update the admin email in the new-user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_email boolean := NEW.email = 'administrativo@3ariva.com.br';
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

-- Ensure administrativo@3ariva.com.br (if already exists) is admin + ativo
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'administrativo@3ariva.com.br' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    UPDATE public.profiles SET status = 'ativo' WHERE user_id = admin_uid;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
