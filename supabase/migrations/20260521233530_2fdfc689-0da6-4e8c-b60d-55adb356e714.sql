
-- Soft/hard capacity
ALTER TABLE public.asesores
  ADD COLUMN IF NOT EXISTS soft_capacidad integer NOT NULL DEFAULT 10;
UPDATE public.asesores SET soft_capacidad = LEAST(soft_capacidad, max_capacidad)
  WHERE soft_capacidad > max_capacidad;

-- Idempotency + activity on turnos
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_cross_branch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_cancelado boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uq_turnos_idempotency
  ON public.turnos(idempotency_key, turno_fecha)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_turnos_estado_actividad
  ON public.turnos(estado, last_activity_at);

CREATE OR REPLACE FUNCTION public.touch_turno_activity()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado
     OR NEW.observaciones IS DISTINCT FROM OLD.observaciones
     OR NEW.asesor_id IS DISTINCT FROM OLD.asesor_id THEN
    NEW.last_activity_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_turnos_touch_activity ON public.turnos;
CREATE TRIGGER trg_turnos_touch_activity
  BEFORE UPDATE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION public.touch_turno_activity();

-- request_turno with idempotency + cross-branch + soft/hard capacity
CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text, p_telefono text, p_correo text, p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL, p_carrera text DEFAULT NULL,
  p_semestre integer DEFAULT NULL, p_sede_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, numero integer, asesor_id uuid, asesor_nombre text,
  personas_delante integer, tiempo_estimado_min integer,
  is_cross_branch boolean, alerta_saturacion boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid; v_numero int; v_fecha date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id uuid; v_asesor_nombre text; v_asesor_sede uuid;
  v_personas int := 0; v_tprom int := 15; v_carga int := 0;
  v_soft_cap int := 0; v_hard_cap int := 0;
  v_cross bool := false; v_alerta bool := false;
  v_motivo text := 'asignacion_normal';
  v_existing record;
BEGIN
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT t.id, t.numero, t.asesor_id, t.sede_id, t.is_cross_branch INTO v_existing
    FROM public.turnos t
    WHERE t.idempotency_key = p_idempotency_key AND t.turno_fecha = v_fecha
    LIMIT 1;
    IF FOUND THEN
      SELECT a.nombre, COALESCE(a.tiempo_promedio_min,15) INTO v_asesor_nombre, v_tprom
      FROM public.asesores a WHERE a.id = v_existing.asesor_id;
      SELECT count(*) INTO v_personas FROM public.turnos t2
      WHERE t2.asesor_id = v_existing.asesor_id AND t2.turno_fecha = v_fecha
        AND t2.estado IN ('pendiente','en_proceso') AND t2.numero < v_existing.numero;
      RETURN QUERY SELECT v_existing.id, v_existing.numero, v_existing.asesor_id,
        v_asesor_nombre, v_personas, (v_personas * v_tprom),
        v_existing.is_cross_branch, false;
      RETURN;
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('assign_advisor'),
    hashtext(COALESCE(p_sede_id::text, 'global')));

  v_asesor_id := public.assign_advisor(p_sede_id);

  IF v_asesor_id IS NOT NULL THEN
    SELECT a.nombre, COALESCE(a.tiempo_promedio_min,15),
           COALESCE(a.soft_capacidad,10), COALESCE(a.max_capacidad,20), a.sede_id
      INTO v_asesor_nombre, v_tprom, v_soft_cap, v_hard_cap, v_asesor_sede
    FROM public.asesores a WHERE a.id = v_asesor_id;

    SELECT count(*) INTO v_carga FROM public.turnos t
    WHERE t.asesor_id = v_asesor_id AND t.turno_fecha = v_fecha
      AND t.estado IN ('pendiente','en_proceso');

    v_personas := v_carga;
    v_cross := (p_sede_id IS NOT NULL AND v_asesor_sede IS NOT NULL AND v_asesor_sede <> p_sede_id);
    v_alerta := (v_carga >= v_soft_cap);

    IF v_cross THEN v_motivo := 'fallback_cross_sede';
    ELSIF v_carga >= v_hard_cap THEN v_motivo := 'fallback_overflow_hard';
    ELSIF v_alerta THEN v_motivo := 'asignacion_saturada_soft';
    END IF;
  ELSE
    v_motivo := 'sin_asesoras_disponibles';
  END IF;

  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero)
    VALUES (v_fecha, 1)
    ON CONFLICT (fecha) DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
    RETURNING c.ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (
    nombre, telefono, correo, tipificacion, simulacion_valor,
    numero, turno_fecha, carrera, semestre, asesor_id, sede_id,
    idempotency_key, is_cross_branch, last_activity_at
  ) VALUES (
    trim(p_nombre), trim(p_telefono),
    nullif(trim(coalesce(p_correo,'')),''), trim(p_tipificacion), p_simulacion_valor,
    v_numero, v_fecha, nullif(trim(coalesce(p_carrera,'')),''),
    p_semestre, v_asesor_id, p_sede_id,
    nullif(trim(coalesce(p_idempotency_key,'')),''), v_cross, now()
  ) RETURNING turnos.id INTO v_id;

  INSERT INTO public.assignment_logs (
    turno_id, asesor_id, sede_id, motivo, fallback,
    carga_al_asignar, capacidad, tiempo_promedio_min, detalle
  ) VALUES (
    v_id, v_asesor_id, p_sede_id, v_motivo,
    (v_carga >= v_hard_cap OR v_cross),
    v_carga, v_hard_cap, v_tprom,
    jsonb_build_object(
      'tipificacion', p_tipificacion, 'numero', v_numero, 'fecha', v_fecha,
      'soft_cap', v_soft_cap, 'hard_cap', v_hard_cap,
      'cross_sede', v_cross, 'alerta_saturacion', v_alerta,
      'sede_solicitada', p_sede_id, 'sede_asignada', v_asesor_sede
    )
  );

  RETURN QUERY SELECT v_id, v_numero, v_asesor_id, v_asesor_nombre,
    v_personas, (COALESCE(v_personas,0) * COALESCE(v_tprom,15)),
    v_cross, v_alerta;
END;
$function$;

-- get_turno_publico with is_cross_branch (drop first due to return type change)
DROP FUNCTION IF EXISTS public.get_turno_publico(uuid);

CREATE FUNCTION public.get_turno_publico(p_id uuid)
RETURNS TABLE(
  id uuid, numero int, estado text,
  asesor_id uuid, asesor_nombre text,
  personas_delante int, tiempo_estimado_min int,
  atencion_inicio timestamptz, atencion_fin timestamptz,
  is_cross_branch bool
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_t record; v_nombre text; v_tprom int := 15; v_personas int := 0;
BEGIN
  SELECT t.id, t.numero, t.estado, t.asesor_id, t.atencion_inicio, t.atencion_fin,
         t.turno_fecha, t.prioridad, COALESCE(t.is_cross_branch,false) AS is_cross_branch
    INTO v_t FROM public.turnos t WHERE t.id = p_id;
  IF v_t.id IS NULL THEN RETURN; END IF;

  IF v_t.asesor_id IS NOT NULL THEN
    SELECT a.nombre, COALESCE(a.tiempo_promedio_min,15) INTO v_nombre, v_tprom
    FROM public.asesores a WHERE a.id = v_t.asesor_id;

    IF v_t.estado IN ('pendiente','en_proceso') THEN
      SELECT count(*) INTO v_personas FROM public.turnos t2
      WHERE t2.asesor_id = v_t.asesor_id AND t2.turno_fecha = v_t.turno_fecha
        AND t2.estado IN ('pendiente','en_proceso')
        AND (
          (CASE t2.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END)
          < (CASE v_t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END)
          OR (
            (CASE t2.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END)
            = (CASE v_t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END)
            AND t2.numero < v_t.numero
          )
        );
    END IF;
  END IF;

  RETURN QUERY SELECT v_t.id, v_t.numero, v_t.estado, v_t.asesor_id, v_nombre,
    v_personas, (v_personas * v_tprom)::int,
    v_t.atencion_inicio, v_t.atencion_fin, v_t.is_cross_branch;
END $function$;

-- Cleanup
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_turnos()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_c int := 0; v_f int := 0;
BEGIN
  WITH u AS (
    UPDATE public.turnos SET estado='cancelado', auto_cancelado=true,
      observaciones=COALESCE(observaciones,'')||' [auto-cancelado por inactividad]'
    WHERE estado='pendiente' AND last_activity_at < now() - INTERVAL '60 minutes'
    RETURNING id
  ) SELECT count(*) INTO v_c FROM u;

  WITH u AS (
    UPDATE public.turnos SET estado='finalizado',
      atencion_fin=COALESCE(atencion_fin, now()), auto_cancelado=true,
      observaciones=COALESCE(observaciones,'')||' [auto-finalizado por timeout]'
    WHERE estado='en_proceso' AND last_activity_at < now() - INTERVAL '90 minutes'
    RETURNING id
  ) SELECT count(*) INTO v_f FROM u;

  UPDATE public.asesores a SET estado_op='disponible'
   WHERE a.estado_op='ocupada'
     AND NOT EXISTS (SELECT 1 FROM public.turnos t WHERE t.asesor_id=a.id AND t.estado='en_proceso');

  RETURN jsonb_build_object('cancelados', v_c, 'finalizados', v_f, 'timestamp', now());
END $function$;

-- pg_cron schedule
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-abandoned-turnos');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule('cleanup-abandoned-turnos', '*/5 * * * *',
  $$ SELECT public.cleanup_abandoned_turnos(); $$);

-- Metrics
CREATE OR REPLACE FUNCTION public.admin_metricas_operativas()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN jsonb_build_object(
    'throughput_hoy', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today AND estado='finalizado'),
    'tiempo_promedio_real_min', COALESCE((SELECT round(avg(EXTRACT(EPOCH FROM (atencion_fin-atencion_inicio))/60)::numeric,1)
       FROM public.turnos WHERE turno_fecha >= v_today - INTERVAL '7 days'
         AND atencion_fin IS NOT NULL AND atencion_inicio IS NOT NULL),0),
    'auto_cancelados_7d', (SELECT count(*) FROM public.turnos
       WHERE turno_fecha >= v_today - INTERVAL '7 days' AND auto_cancelado=true),
    'fallbacks_7d', (SELECT count(*) FROM public.assignment_logs
       WHERE created_at >= now() - INTERVAL '7 days' AND fallback=true),
    'sin_asesora_7d', (SELECT count(*) FROM public.assignment_logs
       WHERE created_at >= now() - INTERVAL '7 days' AND motivo='sin_asesoras_disponibles'),
    'saturacion_por_sede', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT sd.codigo, sd.nombre,
        (SELECT count(*) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS asesoras_activas,
        (SELECT count(*) FROM public.turnos t WHERE t.sede_id=sd.id AND t.turno_fecha=v_today AND t.estado IN ('pendiente','en_proceso')) AS turnos_activos,
        (SELECT COALESCE(sum(soft_capacidad),0) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS capacidad_soft,
        (SELECT COALESCE(sum(max_capacidad),0) FROM public.asesores a WHERE a.sede_id=sd.id AND a.estado_op NOT IN ('offline','jornada_finalizada')) AS capacidad_hard
      FROM public.sedes sd) s), '[]'::jsonb),
    'carga_por_asesora', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY carga_actual DESC) FROM (
      SELECT a.id, a.nombre, a.estado_op, a.soft_capacidad, a.max_capacidad,
        (SELECT count(*) FROM public.turnos t WHERE t.asesor_id=a.id AND t.turno_fecha=v_today AND t.estado IN ('pendiente','en_proceso')) AS carga_actual,
        (SELECT count(*) FROM public.turnos t WHERE t.asesor_id=a.id AND t.turno_fecha=v_today AND t.estado='finalizado') AS atendidos_hoy
      FROM public.asesores a WHERE a.estado_op NOT IN ('offline','jornada_finalizada')) s), '[]'::jsonb),
    'logs_recientes', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT l.created_at, l.motivo, l.fallback, l.carga_al_asignar, l.capacidad,
             a.nombre AS asesora, sd.codigo AS sede
      FROM public.assignment_logs l
      LEFT JOIN public.asesores a ON a.id=l.asesor_id
      LEFT JOIN public.sedes sd ON sd.id=l.sede_id
      ORDER BY l.created_at DESC LIMIT 50) s), '[]'::jsonb)
  );
END $function$;
