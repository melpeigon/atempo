-- Permite gestionar los errores desde el panel sin eliminarlos.

alter table public.errores_app
  add column revisado boolean not null default false,
  add column revisado_at timestamptz,
  add column revisado_por uuid
    references auth.users(id)
    on delete set null;

drop function if exists public.obtener_errores_admin();

create function public.obtener_errores_admin()
returns table (
  id uuid,
  correo text,
  origen text,
  contexto text,
  mensaje text,
  codigo text,
  version_app text,
  plataforma text,
  pagina text,
  fecha timestamptz,
  revisado boolean,
  revisado_at timestamptz
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
    errores.id,
    usuarios.email::text,
    errores.origen,
    errores.contexto,
    errores.mensaje,
    errores.codigo,
    errores.version_app,
    errores.plataforma,
    errores.pagina,
    errores.created_at,
    errores.revisado,
    errores.revisado_at
  from public.errores_app as errores
  left join auth.users as usuarios
    on usuarios.id = errores.usuario_id
  order by errores.revisado asc,
    errores.created_at desc
  limit 20;
end;
$$;

create or replace function public.marcar_error_revisado(
  error_id_objetivo uuid,
  nuevo_estado boolean
)
returns boolean
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

  update public.errores_app
  set
    revisado = nuevo_estado,
    revisado_at = case when nuevo_estado then now() else null end,
    revisado_por = case
      when nuevo_estado then (select auth.uid())
      else null
    end
  where id = error_id_objetivo;

  return found;
end;
$$;

revoke all
on function public.obtener_errores_admin()
from public;

revoke all
on function public.marcar_error_revisado(uuid, boolean)
from public;

grant execute
on function public.obtener_errores_admin()
to authenticated;

grant execute
on function public.marcar_error_revisado(uuid, boolean)
to authenticated;
