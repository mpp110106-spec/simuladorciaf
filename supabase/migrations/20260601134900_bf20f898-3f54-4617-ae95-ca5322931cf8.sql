
-- 1) request_turno: dejar SIEMPRE el turno sin asesora (cola manual)
CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text, p_telefono text, p_correo text, p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL,
  p_carrera text DEFAULT NULL, p_semestre integer DEFAULT NULL,
  p_sede_id uuid DEFAULT NULL, p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE(id uuid, numero integer, asesor_id uuid, asesor_nombre text,
  personas_delante integer, tiempo_estimado_min integer,
  is_cross_branch boolean, alerta_saturacion boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid; v_numero int;
  v_fecha date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_personas int := 0; v_tprom int := 15;
  v_existing record;
BEGIN
  -- Idempotencia
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT t.id AS t_id, t.numero AS t_numero, t.sede_id AS t_sede_id
    INTO v_existing
    FROM public.turnos t
    WHERE t.idempotency_key = p_idempotency_key AND t.turno_fecha = v_fecha
    LIMIT 1;
    IF FOUND THEN
      SELECT count(*) INTO v_personas FROM public.turnos t2
      WHERE t2.sede_id IS NOT DISTINCT FROM v_existing.t_sede_id
        AND t2.turno_fecha = v_fecha
        AND t2.estado = 'pendiente'
        AND t2.asesor_id IS NULL
        AND t2.numero < v_existing.t_numero;
      RETURN QUERY SELECT v_existing.t_id, v_existing.t_numero,
        NULL::uuid, NULL::text, v_personas, (v_personas * v_tprom), false, false;
      RETURN;
    END IF;
  END IF;

  -- Reservar número diario
  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero)
    VALUES (v_fecha, 1)
    ON CONFLICT (fecha) DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
    RETURNING c.ultimo_numero INTO v_numero;

  -- Insertar turno SIN asesora (cola manual)
  INSERT INTO public.turnos (
    nombre, telefono, correo, tipificacion, simulacion_valor,
    numero, turno_fecha, carrera, semestre, asesor_id, sede_id,
    idempotency_key, is_cross_branch, last_activity_at
  ) VALUES (
    trim(p_nombre), trim(p_telefono),
    nullif(trim(coalesce(p_correo,'')),''), trim(p_tipificacion), p_simulacion_valor,
    v_numero, v_fecha, nullif(trim(coalesce(p_carrera,'')),''),
    p_semestre, NULL, p_sede_id,
    nullif(trim(coalesce(p_idempotency_key,'')),''), false, now()
  ) RETURNING turnos.id INTO v_id;

  -- Personas delante en su sede (cola)
  SELECT count(*) INTO v_personas FROM public.turnos t
  WHERE t.sede_id IS NOT DISTINCT FROM p_sede_id
    AND t.turno_fecha = v_fecha
    AND t.estado = 'pendiente'
    AND t.asesor_id IS NULL
    AND t.numero < v_numero;

  INSERT INTO public.assignment_logs (
    turno_id, asesor_id, sede_id, motivo, fallback,
    carga_al_asignar, capacidad, tiempo_promedio_min, detalle
  ) VALUES (
    v_id, NULL, p_sede_id, 'cola_manual', false,
    v_personas, NULL, v_tprom,
    jsonb_build_object('tipificacion', p_tipificacion, 'numero', v_numero,
      'fecha', v_fecha, 'sede_solicitada', p_sede_id, 'modo', 'manual')
  );

  RETURN QUERY SELECT v_id, v_numero, NULL::uuid, NULL::text,
    v_personas, (v_personas * v_tprom), false, false;
END;
$function$;

-- 2) take_turno: la asesora reclama atómicamente un turno pendiente de su sede
CREATE OR REPLACE FUNCTION public.take_turno(p_turno_id uuid)
RETURNS TABLE(id uuid, numero integer, asesor_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_asesor record;
  v_updated_id uuid;
  v_numero int;
BEGIN
  SELECT a.id, a.sede_id, a.estado_op
    INTO v_asesor
  FROM public.asesores a
  WHERE a.user_id = auth.uid();

  IF v_asesor.id IS NULL THEN
    RAISE EXCEPTION 'No es asesora';
  END IF;
  IF v_asesor.estado_op IN ('offline','jornada_finalizada') THEN
    RAISE EXCEPTION 'Asesora fuera de jornada';
  END IF;

  -- Reclamo atómico: solo si sigue libre y es de la misma sede
  UPDATE public.turnos t
    SET asesor_id = v_asesor.id,
        estado = 'en_proceso',
        atencion_inicio = COALESCE(t.atencion_inicio, now()),
        last_activity_at = now(),
        updated_at = now()
    WHERE t.id = p_turno_id
      AND t.asesor_id IS NULL
      AND t.estado = 'pendiente'
      AND t.sede_id IS NOT DISTINCT FROM v_asesor.sede_id
    RETURNING t.id, t.numero INTO v_updated_id, v_numero;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'El turno ya fue tomado por otra asesora o no está disponible';
  END IF;

  UPDATE public.asesores SET estado_op = 'ocupada', last_assigned_at = now()
    WHERE id = v_asesor.id;

  RETURN QUERY SELECT v_updated_id, v_numero, v_asesor.id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.take_turno(uuid) TO authenticated;

-- 3) RLS: las asesoras pueden ver los turnos pendientes sin asignar de su sede
DROP POLICY IF EXISTS turnos_select_cola_sede ON public.turnos;
CREATE POLICY turnos_select_cola_sede
ON public.turnos FOR SELECT TO authenticated
USING (
  asesor_id IS NULL
  AND estado = 'pendiente'
  AND sede_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.asesores a
    WHERE a.user_id = auth.uid()
      AND a.sede_id = turnos.sede_id
  )
);
