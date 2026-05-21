
-- ============ SEDES ============
CREATE TABLE IF NOT EXISTS public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sedes_select_public ON public.sedes;
CREATE POLICY sedes_select_public ON public.sedes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS sedes_admin_manage ON public.sedes;
CREATE POLICY sedes_admin_manage ON public.sedes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

INSERT INTO public.sedes (codigo, nombre) VALUES ('CRAI', 'Sede CRAI'), ('SEXTA', 'Sede Sexta')
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE public.asesores  ADD COLUMN IF NOT EXISTS sede_id uuid REFERENCES public.sedes(id);
ALTER TABLE public.turnos    ADD COLUMN IF NOT EXISTS sede_id uuid REFERENCES public.sedes(id);

UPDATE public.asesores SET sede_id = (SELECT id FROM public.sedes WHERE codigo='CRAI')  WHERE nombre ILIKE 'Mariana%' AND sede_id IS NULL;
UPDATE public.asesores SET sede_id = (SELECT id FROM public.sedes WHERE codigo='SEXTA') WHERE nombre ILIKE 'Juliana%' AND sede_id IS NULL;
UPDATE public.asesores SET sede_id = (SELECT id FROM public.sedes WHERE codigo='CRAI')  WHERE nombre ILIKE 'Elena%'   AND sede_id IS NULL;

-- ============ ENCUESTAS ============
CREATE TABLE IF NOT EXISTS public.encuestas_satisfaccion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL UNIQUE REFERENCES public.turnos(id) ON DELETE CASCADE,
  asesor_id uuid REFERENCES public.asesores(id),
  sede_id uuid REFERENCES public.sedes(id),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  atencion_score int CHECK (atencion_score BETWEEN 1 AND 10),
  tiempo_espera_score int CHECK (tiempo_espera_score BETWEEN 1 AND 10),
  proceso_financiero_score int CHECK (proceso_financiero_score BETWEEN 1 AND 10),
  recomendaria_score int CHECK (recomendaria_score BETWEEN 1 AND 10),
  resolvio_dudas boolean,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.encuestas_satisfaccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS encuestas_insert_public ON public.encuestas_satisfaccion;
CREATE POLICY encuestas_insert_public ON public.encuestas_satisfaccion FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS encuestas_select_superadmin ON public.encuestas_satisfaccion;
CREATE POLICY encuestas_select_superadmin ON public.encuestas_satisfaccion FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- ============ SUPERADMIN BOOTSTRAP ============
CREATE OR REPLACE FUNCTION public.handle_new_superadmin_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'direccion.riesgos@ciaf.edu.co' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_superadmin ON auth.users;
CREATE TRIGGER on_auth_user_superadmin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_superadmin_user();

INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'superadmin'::app_role FROM auth.users WHERE email = 'direccion.riesgos@ciaf.edu.co'
  ON CONFLICT (user_id, role) DO NOTHING;

-- ============ ASSIGN ADVISOR CON SEDE ============
CREATE OR REPLACE FUNCTION public.assign_advisor(p_sede_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text, p_telefono text, p_correo text, p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL, p_carrera text DEFAULT NULL, p_semestre integer DEFAULT NULL,
  p_sede_id uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, numero integer, asesor_id uuid, asesor_nombre text, personas_delante integer, tiempo_estimado_min integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid; v_numero integer;
  v_fecha date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_asesor_id uuid; v_asesor_nombre text;
  v_personas integer := 0; v_tprom integer := 15;
BEGIN
  v_asesor_id := public.assign_advisor(p_sede_id);

  IF v_asesor_id IS NOT NULL THEN
    SELECT a.nombre, a.tiempo_promedio_min INTO v_asesor_nombre, v_tprom
      FROM public.asesores AS a WHERE a.id = v_asesor_id;
    SELECT count(*) INTO v_personas
      FROM public.turnos AS t
      WHERE t.asesor_id = v_asesor_id AND t.turno_fecha = v_fecha AND t.estado IN ('pendiente','en_proceso');
  END IF;

  INSERT INTO public.turno_diario_counters AS c (fecha, ultimo_numero)
    VALUES (v_fecha, 1)
    ON CONFLICT (fecha) DO UPDATE SET ultimo_numero = c.ultimo_numero + 1, updated_at = now()
    RETURNING c.ultimo_numero INTO v_numero;

  INSERT INTO public.turnos (nombre, telefono, correo, tipificacion, simulacion_valor, numero, turno_fecha, carrera, semestre, asesor_id, sede_id)
    VALUES (trim(p_nombre), trim(p_telefono), nullif(trim(coalesce(p_correo,'')),''), trim(p_tipificacion), p_simulacion_valor,
            v_numero, v_fecha, nullif(trim(coalesce(p_carrera,'')),''), p_semestre, v_asesor_id, p_sede_id)
    RETURNING turnos.id INTO v_id;

  RETURN QUERY SELECT v_id, v_numero, v_asesor_id, v_asesor_nombre, v_personas, (COALESCE(v_personas,0) * COALESCE(v_tprom,15));
END $$;

-- ============ ADMIN RPCs ============
CREATE OR REPLACE FUNCTION public.admin_kpis_globales()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today date := (now() AT TIME ZONE 'America/Bogota')::date; v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT jsonb_build_object(
    'estudiantes_hoy', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today),
    'atenciones_activas', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today AND estado = 'en_proceso'),
    'turnos_esperando', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today AND estado = 'pendiente'),
    'finalizados_hoy', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today AND estado = 'finalizado'),
    'financiaciones_hoy', (SELECT count(*) FROM public.turnos WHERE turno_fecha = v_today AND tipificacion = 'Financiación'),
    'firmas_pendientes', (SELECT count(*) FROM public.financiaciones WHERE firmado = false),
    'tiempo_promedio_global', COALESCE((SELECT round(avg(tiempo_espera))::int FROM public.turnos
       WHERE turno_fecha = v_today AND estado = 'finalizado' AND tiempo_espera IS NOT NULL), 0),
    'satisfaccion_promedio', COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.encuestas_satisfaccion
       WHERE created_at::date >= v_today - INTERVAL '30 days'), 0),
    'tasa_finalizacion', COALESCE((SELECT round(100.0 * count(*) FILTER (WHERE estado = 'finalizado') / NULLIF(count(*),0), 1)
       FROM public.turnos WHERE turno_fecha = v_today), 0),
    'por_hora', (SELECT COALESCE(jsonb_agg(jsonb_build_object('hora', hora, 'total', total) ORDER BY hora), '[]'::jsonb)
      FROM (SELECT to_char(created_at AT TIME ZONE 'America/Bogota','HH24') AS hora, count(*) AS total
            FROM public.turnos WHERE turno_fecha = v_today GROUP BY 1) s),
    'por_estado', (SELECT COALESCE(jsonb_agg(jsonb_build_object('estado', estado, 'total', total)), '[]'::jsonb)
      FROM (SELECT estado, count(*) AS total FROM public.turnos WHERE turno_fecha = v_today GROUP BY estado) s),
    'tendencia_7d', (SELECT COALESCE(jsonb_agg(jsonb_build_object('fecha', fecha, 'total', total) ORDER BY fecha), '[]'::jsonb)
      FROM (SELECT turno_fecha AS fecha, count(*) AS total FROM public.turnos
            WHERE turno_fecha >= v_today - INTERVAL '6 days' GROUP BY 1) s)
  ) INTO v_result;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_asesoras_resumen()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
  v_week_start date := v_today - ((EXTRACT(DOW FROM v_today)::int + 6) % 7);
  v_month_start date := date_trunc('month', v_today)::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY satisfaccion DESC NULLS LAST, atendidos_hoy DESC) FROM (
    SELECT
      a.id, a.nombre, a.estado_op, a.is_online, a.hora_inicio, a.hora_fin,
      a.pausa_inicio, a.pausa_fin, a.max_capacidad, a.tiempo_promedio_min,
      s.codigo AS sede_codigo, s.nombre AS sede_nombre, a.sede_id,
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
    LEFT JOIN public.sedes s ON s.id = a.sede_id
    LEFT JOIN public.encuestas_satisfaccion e ON e.asesor_id = a.id AND e.created_at >= now() - INTERVAL '30 days'
    GROUP BY a.id, s.codigo, s.nombre
  ) s), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_sedes_resumen()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
    SELECT sd.id, sd.codigo, sd.nombre,
      (SELECT count(*) FROM public.turnos t WHERE t.sede_id = sd.id AND t.turno_fecha = v_today) AS turnos_hoy,
      (SELECT count(*) FROM public.turnos t WHERE t.sede_id = sd.id AND t.turno_fecha = v_today AND t.estado = 'pendiente') AS en_espera,
      (SELECT count(*) FROM public.turnos t WHERE t.sede_id = sd.id AND t.turno_fecha = v_today AND t.estado = 'en_proceso') AS en_atencion,
      (SELECT count(*) FROM public.turnos t WHERE t.sede_id = sd.id AND t.turno_fecha = v_today AND t.estado = 'finalizado') AS finalizados,
      (SELECT count(*) FROM public.asesores a WHERE a.sede_id = sd.id AND a.is_online = true) AS asesoras_activas,
      (SELECT count(*) FROM public.asesores a WHERE a.sede_id = sd.id) AS asesoras_total,
      (SELECT count(*) FROM public.turnos t WHERE t.sede_id = sd.id AND t.turno_fecha = v_today AND t.tipificacion='Financiación') AS financiaciones,
      COALESCE((SELECT round(avg(tiempo_espera))::int FROM public.turnos t
        WHERE t.sede_id = sd.id AND t.turno_fecha = v_today AND t.estado='finalizado' AND t.tiempo_espera IS NOT NULL), 0) AS tiempo_promedio,
      ROUND(AVG(e.rating)::numeric, 2) AS satisfaccion
    FROM public.sedes sd
    LEFT JOIN public.encuestas_satisfaccion e ON e.sede_id = sd.id AND e.created_at >= now() - INTERVAL '30 days'
    GROUP BY sd.id ORDER BY sd.codigo
  ) s), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_satisfaccion_resumen()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN jsonb_build_object(
    'global', jsonb_build_object(
      'promedio', COALESCE((SELECT round(avg(rating)::numeric,2) FROM public.encuestas_satisfaccion),0),
      'total', (SELECT count(*) FROM public.encuestas_satisfaccion),
      'atencion', COALESCE((SELECT round(avg(atencion_score)::numeric,1) FROM public.encuestas_satisfaccion),0),
      'tiempo', COALESCE((SELECT round(avg(tiempo_espera_score)::numeric,1) FROM public.encuestas_satisfaccion),0),
      'financiero', COALESCE((SELECT round(avg(proceso_financiero_score)::numeric,1) FROM public.encuestas_satisfaccion),0),
      'nps', COALESCE((SELECT round(avg(recomendaria_score)::numeric,1) FROM public.encuestas_satisfaccion),0)
    ),
    'por_asesora', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY promedio DESC NULLS LAST) FROM (
      SELECT a.id, a.nombre, count(e.id) AS total, round(avg(e.rating)::numeric,2) AS promedio
      FROM public.asesores a LEFT JOIN public.encuestas_satisfaccion e ON e.asesor_id = a.id GROUP BY a.id
    ) s), '[]'::jsonb),
    'por_sede', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
      SELECT sd.id, sd.codigo, sd.nombre, count(e.id) AS total, round(avg(e.rating)::numeric,2) AS promedio
      FROM public.sedes sd LEFT JOIN public.encuestas_satisfaccion e ON e.sede_id = sd.id GROUP BY sd.id
    ) s), '[]'::jsonb),
    'distribucion', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY rating) FROM (
      SELECT rating, count(*) AS total FROM public.encuestas_satisfaccion GROUP BY rating
    ) s), '[]'::jsonb),
    'tendencia_30d', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY fecha) FROM (
      SELECT created_at::date AS fecha, round(avg(rating)::numeric,2) AS promedio, count(*) AS total
      FROM public.encuestas_satisfaccion WHERE created_at >= now() - INTERVAL '30 days' GROUP BY 1
    ) s), '[]'::jsonb),
    'comentarios', COALESCE((SELECT jsonb_agg(row_to_json(s) ORDER BY created_at DESC) FROM (
      SELECT e.id, e.rating, e.comentario, e.created_at, a.nombre AS asesora, sd.codigo AS sede
      FROM public.encuestas_satisfaccion e
      LEFT JOIN public.asesores a ON a.id = e.asesor_id
      LEFT JOIN public.sedes sd ON sd.id = e.sede_id
      WHERE e.comentario IS NOT NULL AND length(trim(e.comentario)) > 0
      ORDER BY e.created_at DESC LIMIT 50
    ) s), '[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_sede_asesora(p_asesor_id uuid, p_sede_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.asesores SET sede_id = p_sede_id WHERE id = p_asesor_id;
END $$;

-- Trigger: auto-fill sede_id/asesor_id en encuestas desde el turno
CREATE OR REPLACE FUNCTION public.fill_encuesta_from_turno()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.asesor_id IS NULL OR NEW.sede_id IS NULL THEN
    SELECT t.asesor_id, t.sede_id INTO NEW.asesor_id, NEW.sede_id
    FROM public.turnos t WHERE t.id = NEW.turno_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS encuestas_fill_from_turno ON public.encuestas_satisfaccion;
CREATE TRIGGER encuestas_fill_from_turno BEFORE INSERT ON public.encuestas_satisfaccion
  FOR EACH ROW EXECUTE FUNCTION public.fill_encuesta_from_turno();

ALTER PUBLICATION supabase_realtime ADD TABLE public.encuestas_satisfaccion;

GRANT EXECUTE ON FUNCTION public.assign_advisor(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_turno(text,text,text,text,numeric,text,integer,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_kpis_globales() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_asesoras_resumen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sedes_resumen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_satisfaccion_resumen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_sede_asesora(uuid, uuid) TO authenticated;
