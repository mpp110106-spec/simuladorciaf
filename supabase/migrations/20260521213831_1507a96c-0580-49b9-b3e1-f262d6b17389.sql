
-- Add direccion.financiera as superadmin
CREATE OR REPLACE FUNCTION public.handle_new_superadmin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('direccion.riesgos@ciaf.edu.co', 'direccion.financiera@ciaf.edu.co') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;

-- Backfill for existing user if already registered
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'superadmin'::app_role
FROM auth.users u
WHERE u.email = 'direccion.financiera@ciaf.edu.co'
ON CONFLICT (user_id, role) DO NOTHING;

-- RPC: list all users for superadmin
CREATE OR REPLACE FUNCTION public.admin_usuarios_resumen()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(s) ORDER BY s.created_at DESC) FROM (
      SELECT
        u.id AS user_id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        u.email_confirmed_at,
        p.display_name,
        COALESCE((SELECT array_agg(role::text) FROM public.user_roles r WHERE r.user_id = u.id), ARRAY[]::text[]) AS roles,
        a.id AS asesor_id,
        a.nombre AS asesor_nombre,
        a.estado_op,
        a.is_online,
        sd.codigo AS sede_codigo
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      LEFT JOIN public.asesores a ON a.user_id = u.id
      LEFT JOIN public.sedes sd ON sd.id = a.sede_id
    ) s
  ), '[]'::jsonb);
END $function$;
