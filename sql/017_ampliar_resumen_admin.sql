-- Amplía el resumen del panel con las cuentas que han abierto Atempo
-- durante los últimos 7 días.

drop function if exists public.obtener_resumen_admin();

create function public.obtener_resumen_admin()
returns table (
  total_testers bigint,
  testers_activos bigint
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
  select
    (select count(*)::bigint from auth.users),
    (
      select count(*)::bigint
      from public.actividad_usuarios
      where ultima_apertura >= now() - interval '7 days'
    );
end;
$$;

revoke all on function public.obtener_resumen_admin() from public;
grant execute on function public.obtener_resumen_admin() to authenticated;
