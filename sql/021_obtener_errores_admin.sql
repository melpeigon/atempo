-- Permite consultar los últimos errores únicamente
-- a las cuentas incluidas en public.administradores.

create or replace function public.obtener_errores_admin()
returns table (
  id uuid,
  correo text,
  contexto text,
  mensaje text,
  codigo text,
  version_app text,
  plataforma text,
  pagina text,
  fecha timestamptz
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
    errores.contexto,
    errores.mensaje,
    errores.codigo,
    errores.version_app,
    errores.plataforma,
    errores.pagina,
    errores.created_at
  from public.errores_app as errores
  left join auth.users as usuarios
    on usuarios.id = errores.usuario_id
  order by errores.created_at desc
  limit 10;
end;
$$;

revoke all
on function public.obtener_errores_admin()
from public;

grant execute
on function public.obtener_errores_admin()
to authenticated;