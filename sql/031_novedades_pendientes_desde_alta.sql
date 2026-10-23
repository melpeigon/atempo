-- La etiqueta del panel indica si el tester confirmó todas las novedades
-- publicadas desde la creación de su cuenta, hasta la versión instalada.

drop function if exists public.obtener_testers_admin();
drop function if exists public.obtener_testers_admin(text);

create function public.obtener_testers_admin(version_actual text)
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
    not exists (
      select 1
      from public.novedades_app as novedades
      where novedades.activa = true
        and novedades.publicada_at <= now()
        and novedades.publicada_at >= usuarios.created_at
        and case
          when novedades.version ~ '^\d+(\.\d+){0,2}$'
            and version_actual ~ '^\d+(\.\d+){0,2}$'
          then string_to_array(novedades.version, '.')::integer[]
            <= string_to_array(version_actual, '.')::integer[]
          else false
        end
        and not exists (
          select 1
          from public.novedades_leidas as confirmaciones
          where confirmaciones.novedad_id = novedades.id
            and confirmaciones.usuario_id = usuarios.id
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
language sql
security definer
set search_path = ''
as $$
  select *
  from public.obtener_testers_admin(
    coalesce(
      (
        select novedades.version
        from public.novedades_app as novedades
        where novedades.activa = true
          and novedades.publicada_at <= now()
        order by novedades.publicada_at desc
        limit 1
      ),
      '0.0.0'
    )
  );
$$;

revoke all
on function public.obtener_testers_admin(text)
from public;

grant execute
on function public.obtener_testers_admin(text)
to authenticated;

revoke all
on function public.obtener_testers_admin()
from public;

grant execute
on function public.obtener_testers_admin()
to authenticated;
