-- Strict LRA round-robin assignment, scoped by sede, with no cross-sede stealing.
CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_now_local time := (now() AT TIME ZONE 'America/Bogota')::time;
  v_id uuid;
BEGIN
  -- Fuera de ventana operativa global: nadie disponible
  IF NOT public.is_within_business_hours(now()) THEN
    RETURN NULL;
  END IF;

  -- Selección estricta: filtra por sede solicitada (sede_actual de la asesora),
  -- exige horario individual y capacidad disponible, y ordena por LRA puro.
  WITH candidates AS (
    SELECT
      a.id,
      a.last_assigned_at,
      COALESCE(c.carga, 0) AS carga
    FROM public.asesores a
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS carga
      FROM public.turnos t
      WHERE t.asesor_id = a.id
        AND t.turno_fecha = v_today
        AND t.estado IN ('pendiente','en_proceso')
    ) c ON true
    WHERE a.estado = 'activo'
      AND a.estado_op NOT IN ('offline','jornada_finalizada','almuerzo')
      AND v_now_local >= a.hora_inicio
      AND v_now_local <  a.hora_fin
      AND COALESCE(c.carga, 0) < a.max_capacidad
      AND (p_sede_id IS NULL OR a.sede_id = p_sede_id)
  )
  SELECT id INTO v_id
  FROM candidates
  ORDER BY
    last_assigned_at ASC NULLS FIRST,   -- LRA estricto: la que lleva más tiempo sin atender va primero
    carga ASC,                          -- desempate por carga
    random()                            -- desempate final aleatorio
  LIMIT 1;

  RETURN v_id;
END;
$function$;
