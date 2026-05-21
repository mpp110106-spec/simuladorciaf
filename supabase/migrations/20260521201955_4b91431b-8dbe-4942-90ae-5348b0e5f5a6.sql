ALTER TABLE public.asesores
  ADD COLUMN IF NOT EXISTS hora_inicio time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS hora_fin time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS max_capacidad integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS tiempo_promedio_min integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS asesores_correo_key ON public.asesores(correo);

DROP POLICY IF EXISTS asesores_select_public ON public.asesores;
CREATE POLICY asesores_select_public ON public.asesores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS asesores_admin_manage ON public.asesores;
CREATE POLICY asesores_admin_manage ON public.asesores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.asesores (nombre, correo, estado, hora_inicio, hora_fin, max_capacidad, tiempo_promedio_min, is_online)
VALUES
  ('Mariana Pacheco', 'mariana.pacheco@ciaf.edu.co', 'disponible', '08:00', '17:00', 10, 15, true),
  ('Juliana Mejia',   'juliana.mejia@ciaf.edu.co',   'disponible', '09:00', '18:00', 10, 15, true),
  ('Elena Cabrera',   'elena.cabrera@ciaf.edu.co',   'disponible', '07:00', '16:00', 10, 15, true)
ON CONFLICT (correo) DO NOTHING;

CREATE OR REPLACE FUNCTION public.assign_advisor()
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
  WHERE a.estado = 'disponible' AND a.is_online = true
    AND v_now_time BETWEEN a.hora_inicio AND a.hora_fin
    AND COALESCE(c.carga,0) < a.max_capacidad
  ORDER BY COALESCE(c.carga,0) ASC, a.tiempo_promedio_min ASC, random()
  LIMIT 1;
  RETURN v_asesor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_advisor() TO anon, authenticated;