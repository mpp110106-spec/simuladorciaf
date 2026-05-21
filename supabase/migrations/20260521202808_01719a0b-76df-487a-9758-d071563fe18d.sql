
-- Phase 4: Financiaciones table for credit study workflow
DO $$ BEGIN
  CREATE TYPE financiacion_estado AS ENUM ('pendiente','en_revision','aprobado','rechazado','req_documentos','en_firma','finalizado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.financiaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL,
  estado financiacion_estado NOT NULL DEFAULT 'pendiente',
  firmado boolean NOT NULL DEFAULT false,
  firma_fecha timestamptz,
  observaciones text,
  monto_solicitado numeric,
  cuotas integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financiaciones_turno_id ON public.financiaciones(turno_id);

ALTER TABLE public.financiaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financiaciones_insert_public ON public.financiaciones;
CREATE POLICY financiaciones_insert_public ON public.financiaciones
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS financiaciones_select_public ON public.financiaciones;
CREATE POLICY financiaciones_select_public ON public.financiaciones
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS financiaciones_update_admin ON public.financiaciones;
CREATE POLICY financiaciones_update_admin ON public.financiaciones
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP TRIGGER IF EXISTS fin_set_updated_at ON public.financiaciones;
CREATE TRIGGER fin_set_updated_at BEFORE UPDATE ON public.financiaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
