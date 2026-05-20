CREATE TABLE IF NOT EXISTS public.turno_diario_counters (
  fecha date PRIMARY KEY,
  ultimo_numero integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.turno_diario_counters ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS turno_fecha date;

UPDATE public.turnos
SET turno_fecha = (created_at AT TIME ZONE 'America/Bogota')::date
WHERE turno_fecha IS NULL;

ALTER TABLE public.turnos
  ALTER COLUMN turno_fecha SET NOT NULL;

DROP INDEX IF EXISTS public.turnos_numero_key;
CREATE UNIQUE INDEX IF NOT EXISTS turnos_turno_fecha_numero_key
  ON public.turnos (turno_fecha, numero);

CREATE OR REPLACE FUNCTION public.sync_turno_fecha()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.turno_fecha := (COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/Bogota')::date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_turnos_sync_turno_fecha ON public.turnos;
CREATE TRIGGER trg_turnos_sync_turno_fecha
BEFORE INSERT OR UPDATE OF created_at ON public.turnos
FOR EACH ROW
EXECUTE FUNCTION public.sync_turno_fecha();

CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tipificacion text,
  p_simulacion_valor numeric default null
)
RETURNS TABLE (id uuid, numero integer)
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
  DO UPDATE SET
    ultimo_numero = c.ultimo_numero + 1,
    updated_at = now()
  RETURNING ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (
    nombre,
    telefono,
    correo,
    tipificacion,
    simulacion_valor,
    numero,
    turno_fecha
  )
  VALUES (
    trim(p_nombre),
    trim(p_telefono),
    nullif(trim(coalesce(p_correo, '')), ''),
    trim(p_tipificacion),
    p_simulacion_valor,
    v_numero,
    v_fecha
  )
  RETURNING turnos.id INTO v_id;

  RETURN QUERY SELECT v_id, v_numero;
END;
$$;

REVOKE ALL ON FUNCTION public.request_turno(text, text, text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_turno(text, text, text, text, numeric) TO anon, authenticated;