CREATE OR REPLACE FUNCTION public.get_turno_publico(p_id uuid)
RETURNS TABLE(
  id uuid,
  numero integer,
  estado text,
  asesor_id uuid,
  asesor_nombre text,
  personas_delante integer,
  tiempo_estimado_min integer,
  atencion_inicio timestamptz,
  atencion_fin timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t record;
  v_asesor_nombre text;
  v_tprom integer := 15;
  v_personas integer := 0;
BEGIN
  SELECT t.id, t.numero, t.estado, t.asesor_id, t.atencion_inicio, t.atencion_fin, t.turno_fecha
  INTO v_t
  FROM public.turnos t
  WHERE t.id = p_id;

  IF v_t.id IS NULL THEN RETURN; END IF;

  IF v_t.asesor_id IS NOT NULL THEN
    SELECT a.nombre, COALESCE(a.tiempo_promedio_min,15)
      INTO v_asesor_nombre, v_tprom
      FROM public.asesores a WHERE a.id = v_t.asesor_id;

    IF v_t.estado IN ('pendiente','en_proceso') THEN
      SELECT count(*) INTO v_personas
        FROM public.turnos t2
        WHERE t2.asesor_id = v_t.asesor_id
          AND t2.turno_fecha = v_t.turno_fecha
          AND t2.estado IN ('pendiente','en_proceso')
          AND t2.numero < v_t.numero;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_t.id, v_t.numero, v_t.estado, v_t.asesor_id,
    v_asesor_nombre, v_personas, (v_personas * v_tprom)::int,
    v_t.atencion_inicio, v_t.atencion_fin;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_turno_publico(uuid) TO anon, authenticated;