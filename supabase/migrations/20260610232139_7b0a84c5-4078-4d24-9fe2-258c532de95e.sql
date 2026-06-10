
CREATE OR REPLACE VIEW public.encuesta_modal_audit
WITH (security_invoker = on) AS
SELECT
  t.id AS turno_id,
  t.numero,
  t.turno_fecha,
  t.estado,
  t.encuesta_modal_shown_at,
  (t.encuesta_modal_shown_at IS NOT NULL) AS modal_shown,
  t.atencion_inicio,
  t.atencion_fin,
  t.asesor_id,
  a.nombre AS asesor_nombre,
  t.sede_id,
  sd.codigo AS sede_codigo,
  sd.nombre AS sede_nombre,
  t.created_at,
  t.updated_at
FROM public.turnos t
LEFT JOIN public.asesores a ON a.id = t.asesor_id
LEFT JOIN public.sedes sd ON sd.id = t.sede_id;

GRANT SELECT ON public.encuesta_modal_audit TO authenticated;

-- Política de acceso: solo admin / superadmin pueden leer turnos para esta vista.
-- Las políticas existentes de `turnos` ya restringen acceso; la vista las hereda
-- gracias a security_invoker = on. Adicionalmente exponemos una RPC explícita.
CREATE OR REPLACE FUNCTION public.get_encuesta_modal_audit(p_turno_id uuid DEFAULT NULL)
RETURNS SETOF public.encuesta_modal_audit
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'superadmin'::app_role)) THEN
    RAISE EXCEPTION 'no autorizado';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.encuesta_modal_audit v
  WHERE p_turno_id IS NULL OR v.turno_id = p_turno_id
  ORDER BY v.encuesta_modal_shown_at DESC NULLS LAST, v.created_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_encuesta_modal_audit(uuid) TO authenticated;
