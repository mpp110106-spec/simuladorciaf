
-- ============================================================
-- ENTERPRISE-GRADE ADVISOR ASSIGNMENT LOGIC
-- ============================================================

-- 1) Assignment log table for traceability
CREATE TABLE IF NOT EXISTS public.assignment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid,
  asesor_id uuid,
  sede_id uuid,
  motivo text NOT NULL,
  fallback boolean NOT NULL DEFAULT false,
  carga_al_asignar integer,
  capacidad integer,
  tiempo_promedio_min integer,
  detalle jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assignment_logs_select_admin ON public.assignment_logs;
CREATE POLICY assignment_logs_select_admin ON public.assignment_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE INDEX IF NOT EXISTS idx_assignment_logs_created_at ON public.assignment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_logs_asesor ON public.assignment_logs(asesor_id);

-- 2) Helpful indexes for advisor selection (idempotent)
CREATE INDEX IF NOT EXISTS idx_asesores_sede_estado ON public.asesores(sede_id, estado_op, is_online);
CREATE INDEX IF NOT EXISTS idx_turnos_asesor_fecha_estado ON public.turnos(asesor_id, turno_fecha, estado);

-- 3) New robust assign_advisor (sede-aware, no schedule blocking, fallback safe)
CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today  date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_id     uuid;
BEGIN
  -- PRIMARY: prefer matching sede when provided; exclude only true blockers.
  -- Status that BLOCKS: offline, jornada_finalizada
  -- Everything else (disponible, ocupada, en_llamada, en_pausa, almuerzo) can receive turns.
  -- Schedules/pauses are NOT blocking, only used for analytics.
  WITH candidates AS (
    SELECT
      a.id,
      a.sede_id,
      a.max_capacidad,
      a.tiempo_promedio_min,
      COALESCE(c.carga, 0)                                        AS carga,
      COALESCE(c.carga, 0) * COALESCE(a.tiempo_promedio_min, 15)  AS tiempo_acumulado,
      (p_sede_id IS NOT NULL AND a.sede_id = p_sede_id)           AS sede_match,
      (COALESCE(c.carga, 0) < a.max_capacidad)                    AS under_capacity
    FROM public.asesores a
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS carga
      FROM public.turnos t
      WHERE t.asesor_id = a.id
        AND t.turno_fecha = v_today
        AND t.estado IN ('pendiente', 'en_proceso')
    ) c ON true
    WHERE a.estado = 'activo'
      AND a.estado_op NOT IN ('offline', 'jornada_finalizada')
  )
  SELECT id INTO v_id
  FROM candidates
  WHERE (p_sede_id IS NULL OR sede_match = true)
  ORDER BY
    under_capacity DESC,            -- prefer those with room
    carga ASC,                      -- lowest current load first
    tiempo_acumulado ASC,           -- lowest accumulated wait
    tiempo_promedio_min ASC,        -- faster advisors first
    random()
  LIMIT 1;

  -- FALLBACK 1: any sede if none matched
  IF v_id IS NULL AND p_sede_id IS NOT NULL THEN
    WITH candidates AS (
      SELECT
        a.id, a.max_capacidad, a.tiempo_promedio_min,
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
        AND a.estado_op NOT IN ('offline','jornada_finalizada')
    )
    SELECT id INTO v_id FROM candidates
    ORDER BY under_capacity DESC, carga ASC, tiempo_acumulado ASC, tiempo_promedio_min ASC, random()
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$function$;

-- Drop the no-arg overload to keep a single canonical signature
DROP FUNCTION IF EXISTS public.assign_advisor();

-- 4) Robust request_turno with guaranteed assignment + logging
CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL,
  p_carrera text DEFAULT NULL,
  p_semestre integer DEFAULT NULL,
  p_sede_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  numero integer,
  asesor_id uuid,
  asesor_nombre text,
  personas_delante integer,
  tiempo_estimado_min integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id            uuid;
  v_numero        integer;
  v_fecha         date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id     uuid;
  v_asesor_nombre text;
  v_personas      integer := 0;
  v_tprom         integer := 15;
  v_carga         integer := 0;
  v_capacidad     integer := 0;
  v_fallback      boolean := false;
  v_motivo        text    := 'asignacion_normal';
BEGIN
  -- Serialize advisor selection per sede to prevent race conditions / double load count
  PERFORM pg_advisory_xact_lock(
    hashtext('assign_advisor'),
    hashtext(COALESCE(p_sede_id::text, 'global'))
  );

  v_asesor_id := public.assign_advisor(p_sede_id);

  IF v_asesor_id IS NOT NULL THEN
    SELECT a.nombre, COALESCE(a.tiempo_promedio_min,15), COALESCE(a.max_capacidad,10)
      INTO v_asesor_nombre, v_tprom, v_capacidad
    FROM public.asesores a WHERE a.id = v_asesor_id;

    SELECT count(*) INTO v_carga
    FROM public.turnos t
    WHERE t.asesor_id = v_asesor_id
      AND t.turno_fecha = v_fecha
      AND t.estado IN ('pendiente','en_proceso');

    v_personas := v_carga;
    v_fallback := (v_carga >= v_capacidad);
    IF v_fallback THEN v_motivo := 'fallback_overflow'; END IF;
  ELSE
    v_motivo := 'sin_asesoras_disponibles';
  END IF;

  -- Reserve sequential daily number
  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero)
    VALUES (v_fecha, 1)
    ON CONFLICT (fecha)
    DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
    RETURNING c.ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (
    nombre, telefono, correo, tipificacion, simulacion_valor,
    numero, turno_fecha, carrera, semestre, asesor_id, sede_id
  )
  VALUES (
    trim(p_nombre),
    trim(p_telefono),
    nullif(trim(coalesce(p_correo,'')),''),
    trim(p_tipificacion),
    p_simulacion_valor,
    v_numero, v_fecha,
    nullif(trim(coalesce(p_carrera,'')),''),
    p_semestre,
    v_asesor_id,
    p_sede_id
  )
  RETURNING turnos.id INTO v_id;

  -- Audit log (always)
  INSERT INTO public.assignment_logs (
    turno_id, asesor_id, sede_id, motivo, fallback,
    carga_al_asignar, capacidad, tiempo_promedio_min, detalle
  )
  VALUES (
    v_id, v_asesor_id, p_sede_id, v_motivo, v_fallback,
    v_carga, v_capacidad, v_tprom,
    jsonb_build_object(
      'tipificacion', p_tipificacion,
      'numero', v_numero,
      'fecha', v_fecha
    )
  );

  RETURN QUERY
  SELECT
    v_id,
    v_numero,
    v_asesor_id,
    v_asesor_nombre,
    v_personas,
    (COALESCE(v_personas,0) * COALESCE(v_tprom,15));
END;
$function$;

-- 5) Update call_next_turno: do not block on schedule, only on hard offline state.
CREATE OR REPLACE FUNCTION public.call_next_turno()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_asesor_id uuid;
  v_turno     uuid;
  v_estado    asesor_estado;
BEGIN
  SELECT id, estado_op INTO v_asesor_id, v_estado
  FROM public.asesores WHERE user_id = auth.uid();

  IF v_asesor_id IS NULL THEN RAISE EXCEPTION 'No es asesora'; END IF;
  IF v_estado IN ('offline','jornada_finalizada') THEN
    RAISE EXCEPTION 'Asesora fuera de jornada';
  END IF;

  SELECT id INTO v_turno
  FROM public.turnos
  WHERE asesor_id = v_asesor_id
    AND estado = 'pendiente'
    AND turno_fecha = (now() AT TIME ZONE 'America/Bogota')::date
  ORDER BY
    CASE prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
    numero ASC
  LIMIT 1;

  IF v_turno IS NOT NULL THEN
    PERFORM public.start_atencion(v_turno);
  END IF;

  RETURN v_turno;
END;
$function$;
