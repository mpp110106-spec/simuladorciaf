
-- Add numero column with sequence
CREATE SEQUENCE IF NOT EXISTS public.turnos_numero_seq START 1;

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS numero INTEGER NOT NULL DEFAULT nextval('public.turnos_numero_seq');

ALTER SEQUENCE public.turnos_numero_seq OWNED BY public.turnos.numero;

CREATE UNIQUE INDEX IF NOT EXISTS turnos_numero_key ON public.turnos(numero);

-- Backfill numero for any existing rows that share the default (unlikely, but safe)
-- Existing rows already got distinct nextval values via DEFAULT.

-- Whitelist of admin emails -> auto-grant admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN (
    'auxcobranza@ciaf.edu.co',
    'direccion.riesgos@ciaf.edu.co',
    'aux.cartera1@ciaf.edu.co',
    'pagos@ciaf.edu.co'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- Backfill admin role for any existing users with those emails
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN (
  'auxcobranza@ciaf.edu.co',
  'direccion.riesgos@ciaf.edu.co',
  'aux.cartera1@ciaf.edu.co',
  'pagos@ciaf.edu.co'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger to ensure handle_new_user runs for profile creation if not already attached
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
