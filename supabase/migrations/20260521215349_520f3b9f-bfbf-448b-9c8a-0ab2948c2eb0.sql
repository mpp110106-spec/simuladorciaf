CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_now_time time := (now() AT TIME ZONE 'America/Bogota')::time;
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id uuid;
BEGIN
  SELECT a.id INTO v_asesor_id
  FROM public.asesores a
  LEFT JOIN LATERAL (
    SELECT count(*) AS carga
    FROM public.turnos t
    WHERE t.asesor_id = a.id
      AND t.turno_fecha = v_today
      AND t.estado IN ('pendiente','en_proceso')
  ) c ON true
  WHERE a.is_online = true
    AND a.estado_op = 'disponible'
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > now() - INTERVAL '2 minutes'
    AND COALESCE(c.carga, 0) < a.max_capacidad
    AND (
      (
        v_now_time BETWEEN a.hora_inicio AND a.hora_fin
        AND NOT (
          a.pausa_inicio IS NOT NULL
          AND a.pausa_fin IS NOT NULL
          AND v_now_time BETWEEN a.pausa_inicio AND a.pausa_fin
        )
      )
      OR a.last_seen_at > now() - INTERVAL '2 minutes'
    )
  ORDER BY
    (CASE WHEN p_sede_id IS NOT NULL AND a.sede_id = p_sede_id THEN 0 ELSE 1 END),
    COALESCE(c.carga,0) ASC,
    (COALESCE(c.carga,0) * COALESCE(a.tiempo_promedio_min,15)) ASC,
    a.tiempo_promedio_min ASC,
    random()
  LIMIT 1;

  RETURN v_asesor_id;
END
$function$;

GRANT EXECUTE ON FUNCTION public.assign_advisor(uuid) TO anon, authenticated;