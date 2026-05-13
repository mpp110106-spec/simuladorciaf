
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_turno_prioridad()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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
