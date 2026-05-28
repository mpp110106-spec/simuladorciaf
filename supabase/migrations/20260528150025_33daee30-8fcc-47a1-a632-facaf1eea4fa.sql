
CREATE OR REPLACE FUNCTION public.touch_turno(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_updated int;
BEGIN
  IF p_id IS NULL THEN RETURN false; END IF;

  UPDATE public.turnos
     SET last_activity_at = now()
   WHERE id = p_id
     AND estado IN ('pendiente','en_proceso')
     AND turno_fecha = (now() AT TIME ZONE 'America/Bogota')::date;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.touch_turno(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_turno(uuid) TO anon, authenticated;
