
-- 1) asesores: drop overly-broad public select, add self select
DROP POLICY IF EXISTS asesores_select_public ON public.asesores;

CREATE POLICY asesores_select_self
  ON public.asesores
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2) financiaciones: drop public select/insert, restrict to admin/superadmin
DROP POLICY IF EXISTS financiaciones_select_public ON public.financiaciones;
DROP POLICY IF EXISTS financiaciones_insert_public ON public.financiaciones;

CREATE POLICY financiaciones_select_admin
  ON public.financiaciones
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
  );

CREATE POLICY financiaciones_insert_admin
  ON public.financiaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
  );

-- 3) turnos: drop unrestricted public insert. Creation MUST happen through
--    public.request_turno (SECURITY DEFINER) which validates input & assigns advisor.
DROP POLICY IF EXISTS turnos_insert_public ON public.turnos;

-- 4) encuestas: require turno_id to reference an existing turno
DROP POLICY IF EXISTS encuestas_insert_public ON public.encuestas_satisfaccion;

CREATE POLICY encuestas_insert_valid_turno
  ON public.encuestas_satisfaccion
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.turnos t
      WHERE t.id = turno_id
        AND t.turno_fecha >= (now() AT TIME ZONE 'America/Bogota')::date - INTERVAL '7 days'
    )
    AND rating BETWEEN 1 AND 5
  );

-- 5) Realtime: add explicit subscription policies so realtime.messages is governed.
--    Underlying table RLS still filters payload contents per role.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname = 'realtime_authenticated_subscribe'
  ) THEN
    EXECUTE $p$
      CREATE POLICY realtime_authenticated_subscribe
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (true)
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname = 'realtime_anon_subscribe'
  ) THEN
    -- Anon can subscribe (e.g. student turno tracking).
    -- Row visibility is still gated by RLS on the source tables (turnos has no anon SELECT
    -- policy, so anon receives no row payloads — only presence/broadcast topics).
    EXECUTE $p$
      CREATE POLICY realtime_anon_subscribe
      ON realtime.messages
      FOR SELECT
      TO anon
      USING (true)
    $p$;
  END IF;
END $$;
