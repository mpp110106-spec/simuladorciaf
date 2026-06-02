CREATE OR REPLACE FUNCTION public.take_turno(p_turno_id uuid)
RETURNS TABLE(id uuid, numero integer, asesor_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_asesor_id uuid;
  v_sede_id uuid;
  v_estado asesor_estado;
  v_updated_id uuid;
  v_numero int;
BEGIN
  SELECT a.id, a.sede_id, a.estado_op
    INTO v_asesor_id, v_sede_id, v_estado
  FROM public.asesores a
  WHERE a.user_id = auth.uid();

  IF v_asesor_id IS NULL THEN
    RAISE EXCEPTION 'No es asesora';
  END IF;
  IF v_estado IN ('offline','jornada_finalizada') THEN
    RAISE EXCEPTION 'Asesora fuera de jornada';
  END IF;

  UPDATE public.turnos t
    SET asesor_id = v_asesor_id,
        estado = 'en_proceso',
        atencion_inicio = COALESCE(t.atencion_inicio, now()),
        last_activity_at = now(),
        updated_at = now()
    WHERE t.id = p_turno_id
      AND t.asesor_id IS NULL
      AND t.estado = 'pendiente'
      AND t.sede_id IS NOT DISTINCT FROM v_sede_id
    RETURNING t.id, t.numero INTO v_updated_id, v_numero;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'El turno ya fue tomado por otra asesora o no está disponible';
  END IF;

  UPDATE public.asesores SET estado_op = 'ocupada', last_assigned_at = now()
    WHERE id = v_asesor_id;

  RETURN QUERY SELECT v_updated_id, v_numero, v_asesor_id;
END;
$function$;