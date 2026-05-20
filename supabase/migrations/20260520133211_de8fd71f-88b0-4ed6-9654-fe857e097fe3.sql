ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS carrera text,
  ADD COLUMN IF NOT EXISTS semestre integer;

CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL,
  p_carrera text DEFAULT NULL,
  p_semestre integer DEFAULT NULL
)
RETURNS TABLE(id uuid, numero integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_numero integer;
  v_fecha date := (now() AT TIME ZONE 'America/Bogota')::date;
BEGIN
  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero)
  VALUES (v_fecha, 1)
  ON CONFLICT (fecha)
  DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
  RETURNING ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (
    nombre, telefono, correo, tipificacion, simulacion_valor,
    numero, turno_fecha, carrera, semestre
  )
  VALUES (
    trim(p_nombre),
    trim(p_telefono),
    nullif(trim(coalesce(p_correo,'')),''),
    trim(p_tipificacion),
    p_simulacion_valor,
    v_numero,
    v_fecha,
    nullif(trim(coalesce(p_carrera,'')),''),
    p_semestre
  )
  RETURNING turnos.id INTO v_id;

  RETURN QUERY SELECT v_id, v_numero;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_turno(text, text, text, text, numeric, text, integer) TO anon, authenticated;