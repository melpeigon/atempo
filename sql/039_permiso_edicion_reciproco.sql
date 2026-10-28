-- Permite que cada adulto decida si otro miembro puede editar sus actividades
-- compartidas. No da acceso a actividades privadas ni permite borrar planes ajenos.

begin;

-- Cualquier miembro de la agenda puede consultar qué otros adultos pertenecen
-- a ella. La función solo devuelve sus identificadores y correos.
create or replace function public.obtener_miembros_compartidos(
  familia_consultada uuid
)
returns table (usuario_id uuid, email text, rol text)
language sql
stable
security definer
set search_path = ''
as $$
  select miembro.usuario_id, usuario.email::text, miembro.rol
  from public.miembros_familia as miembro
  join auth.users as usuario on usuario.id = miembro.usuario_id
  where miembro.familia_id = familia_consultada
    and miembro.usuario_id <> (select auth.uid())
    and exists (
      select 1
      from public.miembros_familia as solicitante
      where solicitante.familia_id = familia_consultada
        and solicitante.usuario_id = (select auth.uid())
    );
$$;

create or replace function public.obtener_mi_permiso_edicion(
  familia_consultada uuid,
  usuario_editor uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or usuario_editor = (select auth.uid()) then
    return false;
  end if;

  if not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = (select auth.uid())
  ) or not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_editor
  ) then
    raise exception 'Ambos adultos deben pertenecer a esta agenda';
  end if;

  return exists (
    select 1 from public.permisos_edicion_actividades as permiso
    where permiso.familia_id = familia_consultada
      and permiso.creador_id = (select auth.uid())
      and permiso.editor_id = usuario_editor
  );
end;
$$;

create or replace function public.configurar_mi_permiso_edicion(
  familia_consultada uuid,
  usuario_editor uuid,
  permite_editar boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para cambiar este permiso';
  end if;

  if usuario_editor = (select auth.uid()) or not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = (select auth.uid())
  ) or not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_editor
  ) then
    raise exception 'Elige otro adulto de una agenda a la que perteneces';
  end if;

  if coalesce(permite_editar, false) then
    insert into public.permisos_edicion_actividades (
      familia_id, creador_id, editor_id, concedido_por
    ) values (
      familia_consultada, (select auth.uid()), usuario_editor, (select auth.uid())
    )
    on conflict (familia_id, creador_id, editor_id)
    do update set concedido_por = excluded.concedido_por;
  else
    delete from public.permisos_edicion_actividades as permiso
    where permiso.familia_id = familia_consultada
      and permiso.creador_id = (select auth.uid())
      and permiso.editor_id = usuario_editor;
  end if;

  return true;
end;
$$;

revoke all on function public.obtener_miembros_compartidos(uuid)
  from public, anon, authenticated;
revoke all on function public.obtener_mi_permiso_edicion(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.configurar_mi_permiso_edicion(uuid, uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.obtener_miembros_compartidos(uuid)
  to authenticated;
grant execute on function public.obtener_mi_permiso_edicion(uuid, uuid)
  to authenticated;
grant execute on function public.configurar_mi_permiso_edicion(uuid, uuid, boolean)
  to authenticated;

commit;
