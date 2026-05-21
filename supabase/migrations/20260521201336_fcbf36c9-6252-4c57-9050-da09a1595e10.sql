DROP FUNCTION IF EXISTS public.request_turno(text,text,text,text,numeric,text,integer);

CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text, p_telefono text, p_correo text, p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL, p_carrera text DEFAULT NULL, p_semestre integer DEFAULT NULL
) RETURNS TABLE(id uuid, numero integer, asesor_id uuid, asesor_nombre text, personas_delante integer, tiempo_estimado_min integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid; v_numero integer;
  v_fecha date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id uuid; v_asesor_nombre text;
  v_personas integer := 0; v_tprom integer := 15;
BEGIN
  v_asesor_id := public.assign_advisor();
  IF v_asesor_id IS NOT NULL THEN
    SELECT nombre, tiempo_promedio_min INTO v_asesor_nombre, v_tprom FROM public.asesores WHERE id = v_asesor_id;
    SELECT count(*) INTO v_personas FROM public.turnos
      WHERE asesor_id = v_asesor_id AND turno_fecha = v_fecha AND estado IN ('pendiente','en_proceso');
  END IF;

  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero) VALUES (v_fecha, 1)
  ON CONFLICT (fecha) DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
  RETURNING ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (nombre, telefono, correo, tipificacion, simulacion_valor, numero, turno_fecha, carrera, semestre, asesor_id)
  VALUES (trim(p_nombre), trim(p_telefono), nullif(trim(coalesce(p_correo,'')),''), trim(p_tipificacion),
          p_simulacion_valor, v_numero, v_fecha, nullif(trim(coalesce(p_carrera,'')),''), p_semestre, v_asesor_id)
  RETURNING turnos.id INTO v_id;

  RETURN QUERY SELECT v_id, v_numero, v_asesor_id, v_asesor_nombre, v_personas, (COALESCE(v_personas,0) * COALESCE(v_tprom,15));
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_turno(text,text,text,text,numeric,text,integer) TO anon, authenticated;