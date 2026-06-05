
-- 1) Nuevos campos en turnos
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS documento_identidad text,
  ADD COLUMN IF NOT EXISTS credito_solicitado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS credito_solicitado_at timestamptz,
  ADD COLUMN IF NOT EXISTS credito_solicitado_por uuid,
  ADD COLUMN IF NOT EXISTS firmado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS firmado_at timestamptz,
  ADD COLUMN IF NOT EXISTS firmado_por uuid;

-- 2) Tabla de observaciones (timeline)
CREATE TABLE IF NOT EXISTS public.turno_observaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL,
  autor_user_id uuid NOT NULL,
  autor_nombre text NOT NULL,
  autor_rol text NOT NULL DEFAULT 'asesora',
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_turno_obs_turno ON public.turno_observaciones(turno_id, created_at DESC);

GRANT SELECT, INSERT ON public.turno_observaciones TO authenticated;
GRANT ALL ON public.turno_observaciones TO service_role;

ALTER TABLE public.turno_observaciones ENABLE ROW LEVEL SECURITY;

-- Asesora dueña del turno o admin/superadmin pueden ver
CREATE POLICY "obs_select_authorized" ON public.turno_observaciones
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
    OR public.is_my_turno(turno_id)
  );

-- Misma autorización para insertar; el autor debe ser el usuario actual
CREATE POLICY "obs_insert_authorized" ON public.turno_observaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'superadmin'::app_role)
      OR public.is_my_turno(turno_id)
    )
  );

-- 3) RPC: agregar observación (security definer rellena nombre/rol)
CREATE OR REPLACE FUNCTION public.add_turno_observacion(p_turno_id uuid, p_texto text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_nombre text;
  v_rol text := 'asesora';
  v_id uuid;
  v_ok boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  IF p_texto IS NULL OR length(trim(p_texto)) = 0 THEN
    RAISE EXCEPTION 'observacion vacia';
  END IF;

  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  IF public.has_role(v_user, 'superadmin'::app_role) THEN v_rol := 'superadmin';
  ELSIF public.has_role(v_user, 'admin'::app_role) THEN v_rol := 'admin';
  END IF;

  SELECT COALESCE(a.nombre, p.display_name, u.email)
    INTO v_nombre
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.asesores a ON a.user_id = u.id
  WHERE u.id = v_user;

  INSERT INTO public.turno_observaciones (turno_id, autor_user_id, autor_nombre, autor_rol, texto)
  VALUES (p_turno_id, v_user, COALESCE(v_nombre, 'Usuario'), v_rol, trim(p_texto))
  RETURNING id INTO v_id;

  UPDATE public.turnos SET last_activity_at = now() WHERE id = p_turno_id;
  RETURN v_id;
END;
$$;

-- 4) RPC: marcar/desmarcar solicitud de crédito
CREATE OR REPLACE FUNCTION public.mark_credito_solicitado(p_turno_id uuid, p_solicitado boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_ok boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  UPDATE public.turnos
    SET credito_solicitado = COALESCE(p_solicitado, false),
        credito_solicitado_at = CASE WHEN p_solicitado THEN now() ELSE NULL END,
        credito_solicitado_por = CASE WHEN p_solicitado THEN v_user ELSE NULL END,
        last_activity_at = now()
    WHERE id = p_turno_id;
END;
$$;

-- 5) RPC: marcar/desmarcar firma del estudiante
CREATE OR REPLACE FUNCTION public.mark_firma_estudiante(p_turno_id uuid, p_firmado boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_ok boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  UPDATE public.turnos
    SET firmado = COALESCE(p_firmado, false),
        firmado_at = CASE WHEN p_firmado THEN now() ELSE NULL END,
        firmado_por = CASE WHEN p_firmado THEN v_user ELSE NULL END,
        last_activity_at = now()
    WHERE id = p_turno_id;
END;
$$;

-- 6) RPC: actualizar documento (asesora/admin)
CREATE OR REPLACE FUNCTION public.set_turno_documento(p_turno_id uuid, p_documento text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_ok boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  UPDATE public.turnos
    SET documento_identidad = nullif(trim(coalesce(p_documento,'')), ''),
        last_activity_at = now()
    WHERE id = p_turno_id;
END;
$$;

-- 7) RPC público: obtener detalle completo del turno (autorizado)
CREATE OR REPLACE FUNCTION public.get_turno_detalle(p_turno_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid(); v_ok boolean; v_row jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  SELECT jsonb_build_object(
    'turno', to_jsonb(t.*) || jsonb_build_object(
      'asesor_nombre', a.nombre,
      'sede_codigo', sd.codigo,
      'sede_nombre', sd.nombre
    ),
    'observaciones', COALESCE((
      SELECT jsonb_agg(to_jsonb(o.*) ORDER BY o.created_at DESC)
      FROM public.turno_observaciones o WHERE o.turno_id = t.id
    ), '[]'::jsonb),
    'financiacion', (
      SELECT to_jsonb(f.*) FROM public.financiaciones f
      WHERE f.turno_id = t.id ORDER BY f.created_at DESC LIMIT 1
    )
  )
  INTO v_row
  FROM public.turnos t
  LEFT JOIN public.asesores a ON a.id = t.asesor_id
  LEFT JOIN public.sedes sd ON sd.id = t.sede_id
  WHERE t.id = p_turno_id;

  RETURN v_row;
END;
$$;
