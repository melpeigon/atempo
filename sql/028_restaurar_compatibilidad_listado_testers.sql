-- Mantiene funcionando el panel ya publicado, que todavía llama a la función
-- sin parámetros, mientras el panel nuevo utiliza la versión con parámetro.

drop function if exists public.obtener_testers_admin();

create function public.obtener_testers_admin()
returns table (
  usuario_id uuid,
  correo text,
  plataforma text,
  version_app text,
  ultima_apertura timestamptz,
  instalada boolean,
  notificaciones_activas bigint,
  novedades_informadas boolean,
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
    exists (
      select 1
      from public.novedades_app as novedades
      join public.novedades_leidas as confirmaciones
        on confirmaciones.novedad_id = novedades.id
      where novedades.activa = true
        and novedades.publicada_at <= now()
        and confirmaciones.usuario_id = usuarios.id
        and novedades.version = (
          select ultima_novedad.version
          from public.novedades_app as ultima_novedad
          where ultima_novedad.activa = true
            and ultima_novedad.publicada_at <= now()
          order by ultima_novedad.publicada_at desc
          limit 1
        )
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

revoke all
on function public.obtener_testers_admin()
from public;

grant execute
on function public.obtener_testers_admin()
to authenticated;
