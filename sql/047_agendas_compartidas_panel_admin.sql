-- Devuelve únicamente qué cuentas adultas comparten agenda entre sí.
-- No expone perfiles ni actividades y solo puede consultarlo una administradora.

begin;

create or replace function public.obtener_agendas_compartidas_admin()
returns table (
  usuario_id uuid,
  compartida_con text
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
    miembro.usuario_id,
    string_agg(
      distinct otro_usuario.email::text,
      ', ' order by otro_usuario.email::text
    )
  from public.miembros_familia as miembro
  join public.miembros_familia as otro_miembro
    on otro_miembro.familia_id = miembro.familia_id
    and otro_miembro.usuario_id <> miembro.usuario_id
  join auth.users as otro_usuario
    on otro_usuario.id = otro_miembro.usuario_id
  group by miembro.usuario_id;
end;
$$;

revoke all
on function public.obtener_agendas_compartidas_admin()
from public, anon;

grant execute
on function public.obtener_agendas_compartidas_admin()
to authenticated;

commit;
