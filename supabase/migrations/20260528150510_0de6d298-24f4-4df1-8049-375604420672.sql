
CREATE OR REPLACE FUNCTION public.admin_metricas_operativas(p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_from date := COALESCE(p_from, v_today - INTERVAL '7 days');
  v_to   date := COALESCE(p_to, v_today);
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;

  RETURN jsonb_build_object(
    'rango', jsonb_build_object('from', v_from, 'to', v_to),
    'throughput', (SELECT count(*) FROM public.turnos
       WHERE turno_fecha BETWEEN v_from AND v_to AND estado='finalizado'),
    'creados', (SELECT count(*) FROM public.turnos
       WHERE turno_fecha BETWEEN v_from AND v_to),
    'tiempo_promedio_real_min', COALESCE((SELECT round(avg(EXTRACT(EPOCH FROM (atencion_fin-atencion_inicio))/60)::numeric,1)
       FROM public.turnos WHERE turno_fecha BETWEEN v_from AND v_to
         AND atencion_fin IS NOT NULL AND atencion_inicio IS NOT NULL),0),
    'auto_cancelados', (SELECT count(*) FROM public.turnos
       WHERE turno_fecha BETWEEN v_from AND v_to AND auto_cancelado=true),
    'fallbacks', (SELECT count(*) FROM public.assignment_logs
       WHERE created_at::date BETWEEN v_from AND v_to AND fallback=true),
    'sin_asesora', (SELECT count(*) FROM public.assignment_logs
       WHERE created_at::date BETWEEN v_from AND v_to AND motivo='sin_asesoras_disponibles'),
    'cross_branch', (SELECT count(*) FROM public.turnos
       WHERE turno_fecha BETWEEN v_from AND v_to AND is_cross_branch=true),
    'throughput_por_dia', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY fecha) FROM (
       SELECT turno_fecha AS fecha,
              count(*) FILTER (WHERE estado='finalizado') AS finalizados,
              count(*) FILTER (WHERE auto_cancelado=true) AS auto_cancelados,
              count(*) AS total
       FROM public.turnos WHERE turno_fecha BETWEEN v_from AND v_to GROUP BY 1
    ) s), '[]'::jsonb),
    'fallbacks_por_dia', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY fecha) FROM (
       SELECT created_at::date AS fecha,
              count(*) FILTER (WHERE fallback=true) AS fallbacks,
              count(*) FILTER (WHERE motivo='sin_asesoras_disponibles') AS sin_asesora,
              count(*) AS total
       FROM public.assignment_logs WHERE created_at::date BETWEEN v_from AND v_to GROUP BY 1
    ) s), '[]'::jsonb),
    'saturacion_por_sede', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT sd.codigo, sd.nombre, sd.id,
        (SELECT count(*) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS asesoras_activas,
        (SELECT count(*) FROM public.turnos t WHERE t.sede_id=sd.id AND t.turno_fecha=v_today AND t.estado IN ('pendiente','en_proceso')) AS turnos_activos_hoy,
        (SELECT count(*) FROM public.turnos t WHERE t.sede_id=sd.id AND t.turno_fecha BETWEEN v_from AND v_to AND t.estado='finalizado') AS finalizados_rango,
        (SELECT count(*) FROM public.turnos t WHERE t.sede_id=sd.id AND t.turno_fecha BETWEEN v_from AND v_to AND t.auto_cancelado=true) AS auto_cancelados_rango,
        (SELECT count(*) FROM public.assignment_logs l WHERE l.sede_id=sd.id AND l.created_at::date BETWEEN v_from AND v_to AND l.fallback=true) AS fallbacks_rango,
        (SELECT COALESCE(sum(soft_capacidad),0) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS capacidad_soft,
        (SELECT COALESCE(sum(max_capacidad),0) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS capacidad_hard
      FROM public.sedes sd ORDER BY sd.codigo) s), '[]'::jsonb),
    'fallbacks_por_motivo', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY total DESC) FROM (
      SELECT motivo, count(*) AS total FROM public.assignment_logs
      WHERE created_at::date BETWEEN v_from AND v_to GROUP BY motivo
    ) s), '[]'::jsonb),
    'carga_por_asesora', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY atendidos DESC) FROM (
      SELECT a.id, a.nombre, a.estado_op, a.soft_capacidad, a.max_capacidad,
        (SELECT count(*) FROM public.turnos t WHERE t.asesor_id=a.id AND t.turno_fecha=v_today AND t.estado IN ('pendiente','en_proceso')) AS carga_actual,
        (SELECT count(*) FROM public.turnos t WHERE t.asesor_id=a.id AND t.turno_fecha BETWEEN v_from AND v_to AND t.estado='finalizado') AS atendidos
      FROM public.asesores a WHERE a.estado_op NOT IN ('offline','jornada_finalizada')) s), '[]'::jsonb),
    'logs_recientes', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT l.created_at, l.motivo, l.fallback, l.carga_al_asignar, l.capacidad,
             a.nombre AS asesora, sd.codigo AS sede
      FROM public.assignment_logs l
      LEFT JOIN public.asesores a ON a.id=l.asesor_id
      LEFT JOIN public.sedes sd ON sd.id=l.sede_id
      WHERE l.created_at::date BETWEEN v_from AND v_to
      ORDER BY l.created_at DESC LIMIT 100) s), '[]'::jsonb)
  );
END $function$;
