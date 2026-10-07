-- Devuelve al panel los primeros datos generales de Atempo.
-- Solo una cuenta incluida en public.administradores puede ejecutarla.

create or replace function public.obtener_resumen_admin()
returns table (
  total_testers bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.administradores
    where usuario_id = (select auth.uid())
  ) then
    raise exception 'Acceso no autorizado';
  end if;

  return query
  select count(*)::bigint
  from auth.users;
end;
$$;

-- Nadie puede ejecutar la función por defecto.
revoke all on function public.obtener_resumen_admin() from public;

-- Las cuentas identificadas pueden llamarla, pero la propia función
-- comprueba después si la cuenta es administradora.
grant execute on function public.obtener_resumen_admin() to authenticated;
