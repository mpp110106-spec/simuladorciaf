
-- 1. Enum de estados de asesora
DO $$ BEGIN
  CREATE TYPE public.asesor_estado AS ENUM ('disponible','ocupada','en_llamada','en_pausa','almuerzo','offline','jornada_finalizada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Asesores: nuevas columnas
ALTER TABLE public.asesores
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS pausa_inicio time,
  ADD COLUMN IF NOT EXISTS pausa_fin time,
  ADD COLUMN IF NOT EXISTS estado_op public.asesor_estado NOT NULL DEFAULT 'offline';

-- 3. Upsert de las 3 asesoras vinculadas a sus correos
INSERT INTO public.asesores (nombre, correo, estado, hora_inicio, hora_fin, max_capacidad, tiempo_promedio_min, is_online, estado_op, pausa_inicio, pausa_fin)
VALUES
  ('Mariana Pacheco','pagos@ciaf.edu.co','activo','08:00','17:00',10,15,false,'offline','12:00','13:00'),
  ('Juliana Mejía','auxcobranza@ciaf.edu.co','activo','09:00','18:00',10,15,false,'offline','13:00','14:00'),
  ('Elena Cabrera','aux.cartera1@ciaf.edu.co','activo','07:00','16:00',10,15,false,'offline','12:00','13:00')
ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Asegurar UNIQUE en correo (por si no existía)
DO $$ BEGIN
  ALTER TABLE public.asesores ADD CONSTRAINT asesores_correo_unique UNIQUE (correo);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- 4. Vincular user_id existente de auth.users por email
UPDATE public.asesores a
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(a.correo) AND a.user_id IS NULL;

-- 5. Trigger para vincular en signup
CREATE OR REPLACE FUNCTION public.handle_new_asesor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.asesores
    SET user_id = NEW.id
    WHERE lower(correo) = lower(NEW.email) AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_link_asesor ON auth.users;
CREATE TRIGGER on_auth_user_link_asesor
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_asesor_user();

-- 6. Turnos: control de tiempos
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS atencion_inicio timestamptz,
  ADD COLUMN IF NOT EXISTS atencion_fin timestamptz,
  ADD COLUMN IF NOT EXISTS pausado_at timestamptz,
  ADD COLUMN IF NOT EXISTS observaciones text;

-- 7. Helper: es la asesora del turno
CREATE OR REPLACE FUNCTION public.is_my_turno(_turno_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.turnos t
    JOIN public.asesores a ON a.id = t.asesor_id
    WHERE t.id = _turno_id AND a.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_asesora()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.asesores WHERE user_id = auth.uid());
$$;

-- 8. Política RLS adicional: asesoras ven sus turnos
DROP POLICY IF EXISTS turnos_select_asesora ON public.turnos;
CREATE POLICY turnos_select_asesora ON public.turnos FOR SELECT TO authenticated
USING (
  asesor_id IN (SELECT id FROM public.asesores WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS turnos_update_asesora ON public.turnos;
CREATE POLICY turnos_update_asesora ON public.turnos FOR UPDATE TO authenticated
USING (asesor_id IN (SELECT id FROM public.asesores WHERE user_id = auth.uid()))
WITH CHECK (asesor_id IN (SELECT id FROM public.asesores WHERE user_id = auth.uid()));

-- Asesoras pueden actualizar su propia fila
DROP POLICY IF EXISTS asesores_update_self ON public.asesores;
CREATE POLICY asesores_update_self ON public.asesores FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. assign_advisor mejorada (excluye pausa/almuerzo/offline)
CREATE OR REPLACE FUNCTION public.assign_advisor()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    AND NOT (a.pausa_inicio IS NOT NULL AND a.pausa_fin IS NOT NULL
             AND v_now_time BETWEEN a.pausa_inicio AND a.pausa_fin)
    AND COALESCE(c.carga,0) < a.max_capacidad
  ORDER BY COALESCE(c.carga,0) ASC,
           (COALESCE(c.carga,0) * COALESCE(a.tiempo_promedio_min,15)) ASC,
           a.tiempo_promedio_min ASC,
           random()
  LIMIT 1;
  RETURN v_asesor_id;
END;
$$;

-- 10. start_atencion
CREATE OR REPLACE FUNCTION public.start_atencion(p_turno_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_asesor_id uuid;
BEGIN
  SELECT a.id INTO v_asesor_id FROM public.asesores a WHERE a.user_id = auth.uid();
  IF v_asesor_id IS NULL THEN RAISE EXCEPTION 'No es asesora'; END IF;

  UPDATE public.turnos
    SET estado = 'en_proceso',
        atencion_inicio = COALESCE(atencion_inicio, now()),
        pausado_at = NULL,
        updated_at = now()
    WHERE id = p_turno_id AND asesor_id = v_asesor_id;

  UPDATE public.asesores SET estado_op = 'ocupada' WHERE id = v_asesor_id;
END;
$$;

-- 11. finish_atencion
CREATE OR REPLACE FUNCTION public.finish_atencion(p_turno_id uuid, p_observaciones text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_asesor_id uuid;
  v_dur_min integer;
  v_new_avg integer;
BEGIN
  SELECT a.id INTO v_asesor_id FROM public.asesores a WHERE a.user_id = auth.uid();
  IF v_asesor_id IS NULL THEN RAISE EXCEPTION 'No es asesora'; END IF;

  UPDATE public.turnos
    SET estado = 'finalizado',
        atencion_fin = now(),
        observaciones = COALESCE(p_observaciones, observaciones),
        tiempo_espera = GREATEST(1, EXTRACT(EPOCH FROM (now() - COALESCE(atencion_inicio, created_at)))/60)::int,
        updated_at = now()
    WHERE id = p_turno_id AND asesor_id = v_asesor_id
    RETURNING tiempo_espera INTO v_dur_min;

  IF v_dur_min IS NOT NULL THEN
    SELECT GREATEST(5, ROUND((COALESCE(tiempo_promedio_min,15) * 0.7 + v_dur_min * 0.3)))::int
      INTO v_new_avg FROM public.asesores WHERE id = v_asesor_id;
    UPDATE public.asesores
      SET tiempo_promedio_min = v_new_avg,
          estado_op = CASE WHEN estado_op = 'ocupada' THEN 'disponible' ELSE estado_op END
      WHERE id = v_asesor_id;
  END IF;
END;
$$;

-- 12. set_asesor_estado
CREATE OR REPLACE FUNCTION public.set_asesor_estado(p_estado public.asesor_estado)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.asesores
    SET estado_op = p_estado,
        is_online = (p_estado NOT IN ('offline','jornada_finalizada'))
    WHERE user_id = auth.uid();
END;
$$;

-- 13. call_next_turno
CREATE OR REPLACE FUNCTION public.call_next_turno()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_asesor_id uuid; v_turno uuid;
BEGIN
  SELECT id INTO v_asesor_id FROM public.asesores WHERE user_id = auth.uid();
  IF v_asesor_id IS NULL THEN RAISE EXCEPTION 'No es asesora'; END IF;

  SELECT id INTO v_turno FROM public.turnos
    WHERE asesor_id = v_asesor_id AND estado = 'pendiente'
      AND turno_fecha = (now() AT TIME ZONE 'America/Bogota')::date
    ORDER BY CASE prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, numero ASC
    LIMIT 1;

  IF v_turno IS NOT NULL THEN
    PERFORM public.start_atencion(v_turno);
  END IF;
  RETURN v_turno;
END;
$$;

-- 14. reassign_pending
CREATE OR REPLACE FUNCTION public.reassign_pending(p_asesor_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_new uuid; v_count int := 0;
BEGIN
  FOR r IN SELECT id FROM public.turnos
           WHERE asesor_id = p_asesor_id AND estado = 'pendiente'
             AND turno_fecha = (now() AT TIME ZONE 'America/Bogota')::date
  LOOP
    v_new := public.assign_advisor();
    IF v_new IS NOT NULL AND v_new <> p_asesor_id THEN
      UPDATE public.turnos SET asesor_id = v_new WHERE id = r.id;
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- 15. Realtime
ALTER TABLE public.turnos REPLICA IDENTITY FULL;
ALTER TABLE public.asesores REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.asesores;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
