-- Redefine request_turno para numerar por día (zona horaria America/Bogota)
CREATE OR REPLACE FUNCTION public.request_turno(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tipificacion text,
  p_simulacion_valor numeric DEFAULT NULL
)
RETURNS TABLE(id uuid, numero integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_numero integer;
begin
  -- Calcular el siguiente número del día (Bogotá)
  select coalesce(max(t.numero), 0) + 1
    into v_numero
  from public.turnos t
  where (t.created_at at time zone 'America/Bogota')::date
      = (now() at time zone 'America/Bogota')::date;

  insert into public.turnos (
    nombre, telefono, correo, tipificacion, simulacion_valor, numero
  )
  values (
    trim(p_nombre),
    trim(p_telefono),
    nullif(trim(coalesce(p_correo, '')), ''),
    trim(p_tipificacion),
    p_simulacion_valor,
    v_numero
  )
  returning turnos.id into v_id;

  return query select v_id, v_numero;
end;
$function$;