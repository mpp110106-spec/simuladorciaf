
-- =========================
-- Tablas
-- =========================
CREATE TABLE public.asesores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  correo text UNIQUE NOT NULL,
  estado text NOT NULL DEFAULT 'activo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL,
  correo text,
  tipificacion text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  prioridad text NOT NULL DEFAULT 'media',
  simulacion_valor numeric,
  asesor_id uuid REFERENCES public.asesores(id) ON DELETE SET NULL,
  tiempo_espera integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  pagina text,
  metadata jsonb,
  dispositivo text,
  navegador text,
  sistema_operativo text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_turnos_estado ON public.turnos(estado);
CREATE INDEX idx_turnos_created_at ON public.turnos(created_at DESC);
CREATE INDEX idx_analytics_evento ON public.analytics(evento);
CREATE INDEX idx_analytics_created_at ON public.analytics(created_at DESC);

-- =========================
-- Triggers
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_turnos_updated_at
BEFORE UPDATE ON public.turnos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_turno_prioridad()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tipificacion = 'Financiación' THEN
    NEW.prioridad := 'alta';
  ELSIF NEW.tipificacion = 'Consultas' THEN
    NEW.prioridad := 'media';
  ELSE
    NEW.prioridad := 'baja';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_turnos_prioridad
BEFORE INSERT ON public.turnos
FOR EACH ROW EXECUTE FUNCTION public.set_turno_prioridad();

-- =========================
-- RLS
-- =========================
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asesores ENABLE ROW LEVEL SECURITY;

-- Inserción pública para turnos y analytics (formulario público y tracking)
CREATE POLICY "turnos_insert_public" ON public.turnos
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "analytics_insert_public" ON public.analytics
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Lectura abierta temporalmente para dashboard sin auth
CREATE POLICY "turnos_select_public" ON public.turnos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "turnos_update_public" ON public.turnos
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "analytics_select_public" ON public.analytics
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "asesores_select_public" ON public.asesores
  FOR SELECT TO anon, authenticated USING (true);

-- =========================
-- Realtime
-- =========================
ALTER TABLE public.turnos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turnos;
