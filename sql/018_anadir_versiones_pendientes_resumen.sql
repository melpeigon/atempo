-- Añade al resumen los dispositivos registrados con una versión distinta
-- de la versión actual recibida desde el panel.

drop function if exists public.obtener_resumen_admin();

create function public.obtener_resumen_admin(version_actual text)
returns table (
  total_testers bigint,
  testers_activos bigint,
  versiones_pendientes bigint
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
    ),
    (
      select count(*)::bigint
      from public.actividad_usuarios
      where version_app <> version_actual
    );
end;
$$;

revoke all on function public.obtener_resumen_admin(text) from public;
grant execute on function public.obtener_resumen_admin(text) to authenticated;
