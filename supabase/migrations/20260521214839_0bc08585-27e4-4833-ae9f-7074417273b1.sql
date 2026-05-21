
ALTER TABLE public.asesores ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Heartbeat function: la asesora la llama cada ~30s desde su panel
CREATE OR REPLACE FUNCTION public.asesor_heartbeat()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.asesores
    SET last_seen_at = now()
    WHERE user_id = auth.uid();
END $$;

-- assign_advisor: ahora exige presencia real (latido en los últimos 2 minutos)
CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now_time time := (now() AT TIME ZONE 'America/Bogota')::time;
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id uuid;
BEGIN
  SELECT a.id INTO v_asesor_id
  FROM public.asesores a
  LEFT JOIN LATERAL (
    SELECT count(*) AS carga FROM public.turnos t
    WHERE t.asesor_id = a.id AND t.turno_fecha = v_today AND t.estado IN ('pendiente','en_proceso')
  ) c ON true
  WHERE a.is_online = true
    AND a.estado_op = 'disponible'
    AND a.last_seen_at IS NOT NULL
    AND a.last_seen_at > now() - INTERVAL '2 minutes'
    AND v_now_time BETWEEN a.hora_inicio AND a.hora_fin
    AND NOT (a.pausa_inicio IS NOT NULL AND a.pausa_fin IS NOT NULL AND v_now_time BETWEEN a.pausa_inicio AND a.pausa_fin)
    AND COALESCE(c.carga,0) < a.max_capacidad
  ORDER BY
    (CASE WHEN p_sede_id IS NOT NULL AND a.sede_id = p_sede_id THEN 0 ELSE 1 END),
    COALESCE(c.carga,0) ASC,
    (COALESCE(c.carga,0) * COALESCE(a.tiempo_promedio_min,15)) ASC,
    a.tiempo_promedio_min ASC,
    random()
  LIMIT 1;
  RETURN v_asesor_id;
END $$;

-- admin_asesoras_resumen: incluir presencia real
CREATE OR REPLACE FUNCTION public.admin_asesoras_resumen()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_week_start date := v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7);
  v_month_start date := date_trunc('month', v_today)::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY presente DESC, satisfaccion DESC NULLS LAST, atendidos_hoy DESC) FROM (
    SELECT
      a.id, a.nombre, a.estado_op, a.is_online, a.hora_inicio, a.hora_fin,
      a.pausa_inicio, a.pausa_fin, a.max_capacidad, a.tiempo_promedio_min,
      a.last_seen_at,
      EXTRACT(EPOCH FROM (now() - a.last_seen_at))::int AS segundos_desde_latido,
      (a.last_seen_at IS NOT NULL AND a.last_seen_at > now() - INTERVAL '2 minutes') AS presente,
      sd.codigo AS sede_codigo, sd.nombre AS sede_nombre, a.sede_id,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha = v_today AND t.estado IN ('pendiente','en_proceso')) AS carga_actual,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha = v_today AND t.estado = 'pendiente') AS en_espera,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha = v_today AND t.estado = 'finalizado') AS atendidos_hoy,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha >= v_week_start AND t.estado = 'finalizado') AS atendidos_semana,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha >= v_month_start AND t.estado = 'finalizado') AS atendidos_mes,
      (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.tipificacion = 'Financiación' AND t.estado = 'finalizado' AND t.turno_fecha = v_today) AS financiaciones_hoy,
      ROUND(100.0 * (SELECT count(*) FROM public.turnos t WHERE t.asesor_id = a.id AND t.turno_fecha = v_today AND t.estado IN ('pendiente','en_proceso')) / NULLIF(a.max_capacidad, 0), 0) AS ocupacion,
      ROUND(AVG(e.rating)::numeric, 2) AS satisfaccion,
      count(e.id) AS encuestas_recibidas
    FROM public.asesores a
    LEFT JOIN public.sedes sd ON sd.id = a.sede_id
    LEFT JOIN public.encuestas_satisfaccion e ON e.asesor_id = a.id AND e.created_at >= now() - INTERVAL '30 days'
    GROUP BY a.id, sd.codigo, sd.nombre
  ) s), '[]'::jsonb);
END $$;
