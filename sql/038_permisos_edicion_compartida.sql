-- Permite que la propietaria autorice a un miembro a editar sus actividades
-- compartidas. Las actividades privadas siguen privadas y borrar sigue siendo
-- exclusivo de quien creó la actividad.

begin;

alter table public.invitaciones_familia
  add column if not exists permite_editar_actividades boolean not null default false;

create table if not exists public.permisos_edicion_actividades (
  familia_id uuid not null references public.familias(id) on delete cascade,
  creador_id uuid not null,
  editor_id uuid not null,
  concedido_por uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (familia_id, creador_id, editor_id),
  foreign key (familia_id, creador_id)
    references public.miembros_familia (familia_id, usuario_id)
    on delete cascade,
  foreign key (familia_id, editor_id)
    references public.miembros_familia (familia_id, usuario_id)
    on delete cascade,
  check (creador_id <> editor_id)
);

alter table public.permisos_edicion_actividades enable row level security;
revoke all on public.permisos_edicion_actividades from anon, authenticated;

-- El RPC combinado será la única vía cliente para administrar ambos permisos.
revoke all on function public.configurar_perfiles_compartidos(uuid, uuid, uuid[])
  from public, anon, authenticated;

create or replace function public.configurar_permisos_miembro(
  familia_consultada uuid,
  usuario_destino uuid,
  perfiles_compartidos uuid[],
  permite_editar_actividades boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para cambiar los permisos';
  end if;

  if not exists (
    select 1 from public.miembros_familia as propietaria
    where propietaria.familia_id = familia_consultada
      and propietaria.usuario_id = (select auth.uid())
      and propietaria.rol = 'propietaria'
  ) then
    raise exception 'Solo la propietaria puede cambiar estos permisos';
  end if;

  if usuario_destino = (select auth.uid()) or not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_destino
  ) then
    raise exception 'Elige otro miembro de esta agenda';
  end if;

  if coalesce(permite_editar_actividades, false)
     and cardinality(coalesce(perfiles_compartidos, '{}'::uuid[])) = 0 then
    raise exception 'Comparte al menos un perfil antes de dar permiso para editar';
  end if;

  -- Mantiene la gestión de perfiles ya implementada, pero ahora solo la
  -- propietaria puede invocarla desde una función segura.
  perform public.configurar_perfiles_compartidos(
    familia_consultada, usuario_destino, perfiles_compartidos
  );

  if coalesce(permite_editar_actividades, false) then
    insert into public.permisos_edicion_actividades (
      familia_id, creador_id, editor_id, concedido_por
    )
    values (
      familia_consultada, (select auth.uid()), usuario_destino, (select auth.uid())
    )
    on conflict (familia_id, creador_id, editor_id) do nothing;
  else
    delete from public.permisos_edicion_actividades as permiso
    where permiso.familia_id = familia_consultada
      and permiso.creador_id = (select auth.uid())
      and permiso.editor_id = usuario_destino;
  end if;

  return true;
end;
$$;

create or replace function public.obtener_permiso_edicion_miembro(
  familia_consultada uuid,
  usuario_consultado uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.permisos_edicion_actividades as permiso
    where permiso.familia_id = familia_consultada
      and permiso.creador_id = (select auth.uid())
      and permiso.editor_id = usuario_consultado
      and exists (
        select 1 from public.miembros_familia as propietaria
        where propietaria.familia_id = familia_consultada
          and propietaria.usuario_id = (select auth.uid())
          and propietaria.rol = 'propietaria'
      )
  );
$$;

-- Guarda el permiso elegido antes de enviar la invitación. Se conserva la
-- validación y creación segura del RPC de tres argumentos ya existente.
create or replace function public.crear_invitacion_familia(
  familia_consultada uuid,
  correo_invitado text,
  perfiles_compartidos uuid[],
  permite_editar_actividades boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado jsonb;
  hash_token text;
begin
  if coalesce(permite_editar_actividades, false)
     and cardinality(coalesce(perfiles_compartidos, '{}'::uuid[])) = 0 then
    raise exception 'Comparte al menos un perfil antes de dar permiso para editar';
  end if;

  resultado := public.crear_invitacion_familia(
    familia_consultada, correo_invitado, perfiles_compartidos
  );
  hash_token := encode(
    extensions.digest(convert_to(resultado ->> 'token', 'UTF8'), 'sha256'),
    'hex'
  );

  update public.invitaciones_familia as invitacion
  set permite_editar_actividades = coalesce($4, false)
  where invitacion.token_hash = hash_token
    and invitacion.creada_por = (select auth.uid())
    and invitacion.accepted_at is null;

  if not found then
    raise exception 'No se pudo guardar el permiso de edición de la invitación';
  end if;

  return resultado;
end;
$$;

-- Al aceptar, el permiso ya queda preparado para que RLS autorice solo las
-- actividades compartidas del creador en perfiles que el invitado puede ver.
create or replace function public.aplicar_permiso_edicion_de_invitacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.accepted_at is null
     and new.accepted_at is not null
     and new.accepted_by is not null
     and new.permite_editar_actividades then
    insert into public.permisos_edicion_actividades (
      familia_id, creador_id, editor_id, concedido_por
    )
    values (
      new.familia_id, new.creada_por, new.accepted_by, new.creada_por
    )
    on conflict (familia_id, creador_id, editor_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists aplicar_permiso_edicion_de_invitacion
  on public.invitaciones_familia;
create trigger aplicar_permiso_edicion_de_invitacion
after update of accepted_at on public.invitaciones_familia
for each row execute function public.aplicar_permiso_edicion_de_invitacion();

revoke all on function public.aplicar_permiso_edicion_de_invitacion()
  from public, anon, authenticated;

create or replace function public.obtener_autores_editables(
  familia_consultada uuid
)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select permiso.creador_id
  from public.permisos_edicion_actividades as permiso
  where permiso.familia_id = familia_consultada
    and permiso.editor_id = (select auth.uid())
    and exists (
      select 1 from public.miembros_familia as miembro
      where miembro.familia_id = familia_consultada
        and miembro.usuario_id = (select auth.uid())
    );
$$;

-- El editor delegado solo puede actualizar planes compartidos de perfiles
-- que ya puede consultar. La política de DELETE sigue usando la función
-- original, que solo permite borrar al creador.
create or replace function public.puede_actualizar_actividad_compartida(
  persona_consultada uuid,
  autor_actividad uuid,
  visibilidad_actividad text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.puede_editar_actividad(persona_consultada, autor_actividad)
    or (
      autor_actividad is not null
      and visibilidad_actividad = 'compartida'
      and public.puede_ver_persona(persona_consultada)
      and exists (
        select 1
        from public.personas as persona
        join public.permisos_edicion_actividades as permiso
          on permiso.familia_id = persona.familia_id
        where persona.id = persona_consultada
          and permiso.creador_id = autor_actividad
          and permiso.editor_id = (select auth.uid())
      )
    );
$$;

-- Permite que WITH CHECK acepte al editor delegado sin permitirle cambiar
-- la autoría ni convertir una actividad privada en visible.
create or replace function public.puede_guardar_actividad(
  persona_consultada uuid,
  autor_actividad uuid,
  visibilidad_actividad text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and public.puede_ver_persona(persona.id)
      and (
        (
          persona.tipo_persona = 'menor'
          and (autor_actividad = (select auth.uid()) or autor_actividad is null)
          and (
            visibilidad_actividad in ('privada', 'compartida')
            or autor_actividad is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                (autor_actividad = (select auth.uid())
                  and visibilidad_actividad in ('privada', 'compartida'))
                or (autor_actividad is null and visibilidad_actividad is null)
              )
            )
            or (
              persona.usuario_id is null
              and miembro.rol = 'propietaria'
              and (
                (autor_actividad = (select auth.uid())
                  and visibilidad_actividad in ('privada', 'compartida'))
                or (autor_actividad is null and visibilidad_actividad is null)
              )
            )
          )
        )
        or (
          autor_actividad is not null
          and visibilidad_actividad = 'compartida'
          and exists (
            select 1
            from public.permisos_edicion_actividades as permiso
            where permiso.familia_id = persona.familia_id
              and permiso.creador_id = autor_actividad
              and permiso.editor_id = (select auth.uid())
          )
        )
      )
  );
$$;

drop policy if exists "Autores editan actividades permitidas" on public.actividades;
create policy "Autores y editores autorizados actualizan actividades"
on public.actividades for update to authenticated
using (public.puede_actualizar_actividad_compartida(persona_id, creada_por, visibilidad))
with check (public.puede_guardar_actividad(persona_id, creada_por, visibilidad));

revoke all on function public.configurar_permisos_miembro(uuid, uuid, uuid[], boolean)
  from public, anon, authenticated;
revoke all on function public.obtener_permiso_edicion_miembro(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.crear_invitacion_familia(uuid, text, uuid[], boolean)
  from public, anon, authenticated;
revoke all on function public.obtener_autores_editables(uuid)
  from public, anon, authenticated;
revoke all on function public.puede_actualizar_actividad_compartida(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.puede_guardar_actividad(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.configurar_permisos_miembro(uuid, uuid, uuid[], boolean)
  to authenticated;
grant execute on function public.obtener_permiso_edicion_miembro(uuid, uuid)
  to authenticated;
grant execute on function public.crear_invitacion_familia(uuid, text, uuid[], boolean)
  to authenticated;
grant execute on function public.obtener_autores_editables(uuid)
  to authenticated;
grant execute on function public.puede_actualizar_actividad_compartida(uuid, uuid, text)
  to authenticated;
grant execute on function public.puede_guardar_actividad(uuid, uuid, text)
  to authenticated;

commit;
