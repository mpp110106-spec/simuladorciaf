
-- 1. Campo LRA
ALTER TABLE public.asesores
  ADD COLUMN IF NOT EXISTS last_assigned_at timestamptz;

-- 2. Helper de horario operativo global
CREATE OR REPLACE FUNCTION public.is_within_business_hours(p_ts timestamptz DEFAULT now())
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH local_ts AS (
    SELECT (p_ts AT TIME ZONE 'America/Bogota') AS lt
  )
  SELECT CASE EXTRACT(DOW FROM (SELECT lt FROM local_ts))::int
    -- 0 = Domingo (cerrado)
    WHEN 0 THEN false
    -- 6 = Sábado: 08:00 - 13:00
    WHEN 6 THEN (SELECT lt::time FROM local_ts) >= TIME '08:00'
             AND (SELECT lt::time FROM local_ts) <  TIME '13:00'
    -- Lun-Vie: 08:00 - 18:30
    ELSE (SELECT lt::time FROM local_ts) >= TIME '08:00'
     AND (SELECT lt::time FROM local_ts) <  TIME '18:30'
  END;
$$;

-- 3. assign_advisor con horario global + horario por asesora + LRA como desempate
CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_now_local time := (now() AT TIME ZONE 'America/Bogota')::time;
  v_id uuid;
BEGIN
  -- Fuera de ventana operativa global: nadie disponible
  IF NOT public.is_within_business_hours(now()) THEN
    RETURN NULL;
  END IF;

  -- PRIMARIO: respeta sede + horario individual + LRA como desempate
  WITH candidates AS (
    SELECT
      a.id, a.sede_id, a.max_capacidad, a.tiempo_promedio_min, a.last_assigned_at,
      COALESCE(c.carga, 0) AS carga,
      COALESCE(c.carga, 0) * COALESCE(a.tiempo_promedio_min, 15) AS tiempo_acumulado,
      (p_sede_id IS NOT NULL AND a.sede_id = p_sede_id) AS sede_match,
      (COALESCE(c.carga, 0) < a.max_capacidad) AS under_capacity
    FROM public.asesores a
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS carga FROM public.turnos t
      WHERE t.asesor_id = a.id AND t.turno_fecha = v_today
        AND t.estado IN ('pendiente','en_proceso')
    ) c ON true
    WHERE a.estado = 'activo'
      AND a.estado_op NOT IN ('offline','jornada_finalizada','almuerzo')
      AND v_now_local >= a.hora_inicio
      AND v_now_local <  a.hora_fin
  )
  SELECT id INTO v_id
  FROM candidates
  WHERE (p_sede_id IS NULL OR sede_match = true)
  ORDER BY
    under_capacity DESC,
    carga ASC,
    last_assigned_at ASC NULLS FIRST,
    tiempo_acumulado ASC,
    tiempo_promedio_min ASC,
    random()
  LIMIT 1;

  -- FALLBACK: cualquier sede dentro de la ventana global + horario individual
  IF v_id IS NULL AND p_sede_id IS NOT NULL THEN
    WITH candidates AS (
      SELECT
        a.id, a.max_capacidad, a.tiempo_promedio_min, a.last_assigned_at,
        COALESCE(c.carga, 0) AS carga,
        COALESCE(c.carga, 0) * COALESCE(a.tiempo_promedio_min, 15) AS tiempo_acumulado,
        (COALESCE(c.carga, 0) < a.max_capacidad) AS under_capacity
      FROM public.asesores a
      LEFT JOIN LATERAL (
        SELECT count(*)::int AS carga FROM public.turnos t
        WHERE t.asesor_id = a.id AND t.turno_fecha = v_today
          AND t.estado IN ('pendiente','en_proceso')
      ) c ON true
      WHERE a.estado = 'activo'
        AND a.estado_op NOT IN ('offline','jornada_finalizada','almuerzo')
        AND v_now_local >= a.hora_inicio
        AND v_now_local <  a.hora_fin
    )
    SELECT id INTO v_id FROM candidates
    ORDER BY under_capacity DESC, carga ASC, last_assigned_at ASC NULLS FIRST,
             tiempo_acumulado ASC, tiempo_promedio_min ASC, random()
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

-- 4. Actualizar request_turno (la versión "completa" con sede + idempotencia)
--    para sellar last_assigned_at cuando hay asesora asignada
CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text, p_telefono text, p_correo text, p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL::numeric,
  p_carrera text DEFAULT NULL::text,
  p_semestre integer DEFAULT NULL::integer,
  p_sede_id uuid DEFAULT NULL::uuid,
  p_idempotency_key text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, numero integer, asesor_id uuid, asesor_nombre text,
              personas_delante integer, tiempo_estimado_min integer,
              is_cross_branch boolean, alerta_saturacion boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- LRA: marcar última asignación
    UPDATE public.asesores SET last_assigned_at = now() WHERE id = v_asesor_id;
  ELSE
    v_motivo := CASE WHEN public.is_within_business_hours(now())
                     THEN 'sin_asesoras_disponibles'
                     ELSE 'fuera_de_horario' END;
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
    (v_carga >= v_hard_cap OR v_cross OR v_asesor_id IS NULL),
    v_carga, v_hard_cap, v_tprom,
    jsonb_build_object(
      'tipificacion', p_tipificacion, 'numero', v_numero, 'fecha', v_fecha,
      'soft_cap', v_soft_cap, 'hard_cap', v_hard_cap,
      'cross_sede', v_cross, 'alerta_saturacion', v_alerta,
      'sede_solicitada', p_sede_id, 'sede_asignada', v_asesor_sede,
      'business_hours', public.is_within_business_hours(now())
    )
  );

  RETURN QUERY SELECT v_id, v_numero, v_asesor_id, v_asesor_nombre,
    v_personas, (COALESCE(v_personas,0) * COALESCE(v_tprom,15)),
    v_cross, v_alerta;
END;
$$;

-- 5. RPC monitoreo: Cola LRA
CREATE OR REPLACE FUNCTION public.admin_cola_lra()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_now_local time := (now() AT TIME ZONE 'America/Bogota')::time;
BEGIN
  IF NOT (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'business_hours', public.is_within_business_hours(now()),
    'now_local', to_char(now() AT TIME ZONE 'America/Bogota','YYYY-MM-DD HH24:MI:SS'),
    'cola', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY orden) FROM (
      SELECT
        a.id, a.nombre, a.estado_op, a.last_assigned_at,
        a.hora_inicio, a.hora_fin, a.max_capacidad, a.soft_capacidad,
        sd.codigo AS sede_codigo,
        (a.estado = 'activo'
         AND a.estado_op NOT IN ('offline','jornada_finalizada','almuerzo')
         AND v_now_local >= a.hora_inicio AND v_now_local < a.hora_fin
         AND public.is_within_business_hours(now())) AS elegible,
        (SELECT count(*) FROM public.turnos t
          WHERE t.asesor_id = a.id AND t.turno_fecha = v_today
            AND t.estado IN ('pendiente','en_proceso')) AS carga_actual,
        (SELECT count(*) FROM public.turnos t
          WHERE t.asesor_id = a.id AND t.turno_fecha = v_today
            AND t.estado = 'finalizado') AS atendidos_hoy,
        ROW_NUMBER() OVER (
          ORDER BY (a.last_assigned_at IS NULL) DESC, a.last_assigned_at ASC
        ) AS orden
      FROM public.asesores a
      LEFT JOIN public.sedes sd ON sd.id = a.sede_id
    ) s), '[]'::jsonb)
  );
END;
$$;
