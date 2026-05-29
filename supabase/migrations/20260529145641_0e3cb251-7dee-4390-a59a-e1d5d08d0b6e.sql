-- Fix 1: Restrict user_roles management to superadmin only (prevent admin privilege escalation)
DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;

CREATE POLICY user_roles_superadmin_manage
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Keep SELECT for admins to view (read-only) plus self-select
DROP POLICY IF EXISTS user_roles_select_self ON public.user_roles;
CREATE POLICY user_roles_select_self
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
  );

-- Fix 2: Prevent survey flooding — enforce one survey per turno
CREATE UNIQUE INDEX IF NOT EXISTS encuestas_satisfaccion_turno_id_unique
  ON public.encuestas_satisfaccion (turno_id);

DROP POLICY IF EXISTS encuestas_insert_valid_turno ON public.encuestas_satisfaccion;
CREATE POLICY encuestas_insert_valid_turno
  ON public.encuestas_satisfaccion
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND EXISTS (
      SELECT 1 FROM public.turnos t
      WHERE t.id = encuestas_satisfaccion.turno_id
        AND t.estado = 'finalizado'
        AND t.turno_fecha >= ((now() AT TIME ZONE 'America/Bogota')::date - INTERVAL '7 days')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.encuestas_satisfaccion e2
      WHERE e2.turno_id = encuestas_satisfaccion.turno_id
    )
  );
