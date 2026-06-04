
-- 1) Tighten realtime.messages SELECT policy to limit PII broadcast
DROP POLICY IF EXISTS realtime_authenticated_subscribe ON realtime.messages;
DROP POLICY IF EXISTS realtime_anon_subscribe ON realtime.messages;

CREATE POLICY realtime_authorized_subscribe ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'superadmin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.asesores a WHERE a.user_id = auth.uid())
);

-- 2) Prevent asesor self-privilege escalation via UPDATE on protected columns
CREATE OR REPLACE FUNCTION public.prevent_asesor_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for non-admin self-updates
  IF auth.uid() IS NOT NULL
     AND NEW.user_id = auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)
     AND NOT public.has_role(auth.uid(), 'superadmin'::public.app_role) THEN
    IF NEW.sede_id        IS DISTINCT FROM OLD.sede_id
       OR NEW.soft_capacidad IS DISTINCT FROM OLD.soft_capacidad
       OR NEW.estado         IS DISTINCT FROM OLD.estado
       OR NEW.user_id        IS DISTINCT FROM OLD.user_id
       OR NEW.nombre         IS DISTINCT FROM OLD.nombre
       OR NEW.correo         IS DISTINCT FROM OLD.correo
    THEN
      RAISE EXCEPTION 'No autorizado: solo administradores pueden modificar estos campos del asesor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_asesor_self_escalation ON public.asesores;
CREATE TRIGGER trg_prevent_asesor_self_escalation
BEFORE UPDATE ON public.asesores
FOR EACH ROW EXECUTE FUNCTION public.prevent_asesor_self_privilege_escalation();
