create or replace function public.request_turno(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tipificacion text,
  p_simulacion_valor numeric default null
)
returns table (id uuid, numero integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_turno public.turnos%rowtype;
begin
  insert into public.turnos (
    nombre,
    telefono,
    correo,
    tipificacion,
    simulacion_valor
  )
  values (
    trim(p_nombre),
    trim(p_telefono),
    nullif(trim(coalesce(p_correo, '')), ''),
    trim(p_tipificacion),
    p_simulacion_valor
  )
  returning * into v_turno;

  return query
  select v_turno.id, v_turno.numero;
end;
$$;

revoke all on function public.request_turno(text, text, text, text, numeric) from public;
grant execute on function public.request_turno(text, text, text, text, numeric) to anon, authenticated;