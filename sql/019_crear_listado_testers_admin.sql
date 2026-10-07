-- Devuelve al panel un listado técnico de cuentas para soporte y pruebas.
-- No incluye personas, actividades ni contenido de las agendas familiares.

create or replace function public.obtener_testers_admin()
returns table (
  usuario_id uuid,
  correo text,
  plataforma text,
  version_app text,
  ultima_apertura timestamptz,
  instalada boolean,
  notificaciones_activas bigint,
  estado text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  ) then
    raise exception 'Acceso no autorizado';
  end if;

  return query
  select
    usuarios.id,
    usuarios.email::text,
    actividad.plataforma,
    actividad.version_app,
    actividad.ultima_apertura,
    actividad.instalada,
    (
      select count(*)::bigint
      from public.dispositivos_notificaciones as dispositivos
      where dispositivos.usuario_id = usuarios.id
        and dispositivos.activo = true
    ),
    case
      when usuarios.email_confirmed_at is null then 'Pendiente de confirmar'
      when actividad.ultima_apertura is null then 'Sin datos de apertura'
      when actividad.ultima_apertura >= now() - interval '7 days' then 'Activa'
      else 'Sin actividad reciente'
    end
  from auth.users as usuarios
  left join public.actividad_usuarios as actividad
    on actividad.usuario_id = usuarios.id
  order by actividad.ultima_apertura desc nulls last,
    usuarios.created_at desc;
end;
$$;

revoke all on function public.obtener_testers_admin() from public;
grant execute on function public.obtener_testers_admin() to authenticated;
