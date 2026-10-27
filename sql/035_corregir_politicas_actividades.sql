-- Corrige las políticas de actividades para que las comprobaciones de
-- lectura/edición no vuelvan a consultar public.actividades desde su propia
-- política RLS. Esto evita la recursión y permite INSERT ... RETURNING.
-- Requiere haber ejecutado 034_politicas_datos_compartidos.sql.

begin;

-- Quitamos primero las políticas que dependen de las funciones anteriores.
drop policy if exists "Miembros pueden consultar actividades permitidas"
  on public.actividades;
drop policy if exists "Autores pueden editar actividades permitidas"
  on public.actividades;
drop policy if exists "Usuarios pueden borrar actividades permitidas"
  on public.actividades;

drop function if exists public.puede_ver_actividad(uuid);
drop function if exists public.puede_editar_actividad(uuid);

-- Las funciones reciben los datos de la fila que RLS ya está evaluando y solo
-- consultan personas/miembros_familia, nunca la tabla actividades.
create function public.puede_ver_actividad(
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
      and (
        (
          persona.tipo_persona = 'menor'
          and (
            autor_actividad = (select auth.uid())
            or visibilidad_actividad = 'compartida'
            or autor_actividad is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                autor_actividad = (select auth.uid())
                or autor_actividad is null
              )
            )
            or (
              persona.usuario_id is null
              and (
                autor_actividad = (select auth.uid())
                or (
                  autor_actividad is not null
                  and visibilidad_actividad = 'compartida'
                )
                or (
                  autor_actividad is null
                  and miembro.rol = 'propietaria'
                )
              )
            )
          )
        )
      )
  );
$$;

create function public.puede_editar_actividad(
  persona_consultada uuid,
  autor_actividad uuid
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
      and (
        (
          persona.tipo_persona = 'menor'
          and (
            autor_actividad = (select auth.uid())
            or autor_actividad is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                autor_actividad = (select auth.uid())
                or autor_actividad is null
              )
            )
            or (
              persona.usuario_id is null
              and (
                autor_actividad = (select auth.uid())
                or (
                  autor_actividad is null
                  and miembro.rol = 'propietaria'
                )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function public.puede_ver_actividad(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.puede_editar_actividad(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.puede_ver_actividad(uuid, uuid, text)
  to authenticated;
grant execute on function public.puede_editar_actividad(uuid, uuid)
  to authenticated;

create policy "Miembros pueden consultar actividades permitidas"
on public.actividades
for select
to authenticated
using (
  public.puede_ver_actividad(persona_id, creada_por, visibilidad)
);

create policy "Autores pueden editar actividades permitidas"
on public.actividades
for update
to authenticated
using (
  public.puede_editar_actividad(persona_id, creada_por)
)
with check (
  public.puede_guardar_actividad(persona_id, creada_por, visibilidad)
);

create policy "Usuarios pueden borrar actividades permitidas"
on public.actividades
for delete
to authenticated
using (
  public.puede_editar_actividad(persona_id, creada_por)
);

commit;
