-- Primera versión de las políticas para compartir agendas entre adultos.
-- Requiere que 033_preparar_datos_compartidos.sql ya se haya ejecutado.
-- Revisar y probar con dos cuentas antes de aceptar invitaciones reales.

-- Los cambios de miembros se harán con funciones SQL seguras de invitación,
-- no insertando o borrando filas directamente desde el navegador.
drop policy if exists "Propietarias pueden añadir miembros"
  on public.miembros_familia;
drop policy if exists "Propietarias pueden editar miembros"
  on public.miembros_familia;
drop policy if exists "Propietarias pueden eliminar miembros"
  on public.miembros_familia;

-- No se permite borrar una familia desde el cliente: borraría en cascada sus
-- personas y actividades. Se diseñará un flujo explícito más adelante.
drop policy if exists "Propietarias pueden eliminar su familia"
  on public.familias;

-- Todas las personas de una agenda son visibles para sus miembros. Los
-- perfiles de adultos vinculados solo los puede modificar su titular; los
-- perfiles de menores y adultos sin cuenta los pueden modificar los miembros.
drop policy if exists "Miembros pueden gestionar personas"
  on public.personas;

create policy "Miembros pueden ver personas de su agenda"
on public.personas
for select
to authenticated
using (public.es_miembro_familia(familia_id));

create policy "Miembros pueden crear personas de su agenda"
on public.personas
for insert
to authenticated
with check (
  public.es_miembro_familia(familia_id)
  and (
    (tipo_persona = 'menor' and usuario_id is null)
    or (
      tipo_persona = 'adulto'
      and (usuario_id is null or usuario_id = (select auth.uid()))
    )
  )
);

create policy "Miembros pueden editar personas permitidas"
on public.personas
for update
to authenticated
using (
  public.es_miembro_familia(familia_id)
  and (
    tipo_persona = 'menor'
    or usuario_id is null
    or usuario_id = (select auth.uid())
  )
)
with check (
  public.es_miembro_familia(familia_id)
  and (
    (tipo_persona = 'menor' and usuario_id is null)
    or (
      tipo_persona = 'adulto'
      and (usuario_id is null or usuario_id = (select auth.uid()))
    )
  )
);

create policy "Miembros pueden borrar personas permitidas"
on public.personas
for delete
to authenticated
using (
  public.es_miembro_familia(familia_id)
  and (
    tipo_persona = 'menor'
    or usuario_id is null
    or usuario_id = (select auth.uid())
  )
);

-- Evita que una petición directa cambie la familia, el tipo o la cuenta
-- vinculada de una persona. La aplicación actual solo edita nombre, color e
-- icono. El vínculo de una cuenta adulta se hará mediante una función segura.
create or replace function public.proteger_identidad_persona()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.familia_id is distinct from old.familia_id
     or new.tipo_persona is distinct from old.tipo_persona
     or new.usuario_id is distinct from old.usuario_id then
    raise exception 'No se puede cambiar la familia, el tipo o la cuenta vinculada de una persona';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_identidad_persona_antes_de_actualizar
  on public.personas;

create trigger proteger_identidad_persona_antes_de_actualizar
before update on public.personas
for each row
execute function public.proteger_identidad_persona();

-- Una actividad se puede reasignar a otra persona de la misma familia, pero
-- nunca mover de una familia a otra aunque la cuenta pertenezca a ambas.
create or replace function public.evitar_mover_actividad_entre_familias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  familia_anterior uuid;
  familia_nueva uuid;
begin
  if new.persona_id is distinct from old.persona_id then
    select persona.familia_id
      into familia_anterior
      from public.personas as persona
      where persona.id = old.persona_id;

    select persona.familia_id
      into familia_nueva
      from public.personas as persona
      where persona.id = new.persona_id;

    if familia_anterior is null
       or familia_nueva is null
       or familia_anterior is distinct from familia_nueva then
      raise exception 'Una actividad no se puede mover a otra familia';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists evitar_mover_actividad_entre_familias_antes_de_guardar
  on public.actividades;

create trigger evitar_mover_actividad_entre_familias_antes_de_guardar
before update of persona_id on public.actividades
for each row
execute function public.evitar_mover_actividad_entre_familias();

-- Función privada para consultar una actividad según su persona, autoría,
-- visibilidad y la relación del usuario con esa familia.
create or replace function public.puede_ver_actividad(
  actividad_consultada uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.actividades as actividad
    join public.personas as persona
      on persona.id = actividad.persona_id
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where actividad.id = actividad_consultada
      and miembro.usuario_id = (select auth.uid())
      and (
        (
          persona.tipo_persona = 'menor'
          and (
            actividad.creada_por = (select auth.uid())
            or actividad.visibilidad = 'compartida'
            or actividad.creada_por is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                actividad.creada_por = (select auth.uid())
                or actividad.creada_por is null
              )
            )
            or (
              persona.usuario_id is null
              and (
                actividad.creada_por = (select auth.uid())
                or (
                  actividad.creada_por is not null
                  and actividad.visibilidad = 'compartida'
                )
                or (
                  actividad.creada_por is null
                  and miembro.rol = 'propietaria'
                )
              )
            )
          )
        )
      )
  );
$$;

-- El autor puede editar sus actividades nuevas. Los planes infantiles
-- antiguos (sin autor) siguen compartidos y editables por ambos adultos.
-- Los planes antiguos de perfiles adultos quedan limitados al titular si está
-- vinculado; si no lo está, solo los ve y gestiona la propietaria de la agenda.
create or replace function public.puede_editar_actividad(
  actividad_consultada uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.actividades as actividad
    join public.personas as persona
      on persona.id = actividad.persona_id
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where actividad.id = actividad_consultada
      and miembro.usuario_id = (select auth.uid())
      and (
        (
          persona.tipo_persona = 'menor'
          and (
            actividad.creada_por = (select auth.uid())
            or actividad.creada_por is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                actividad.creada_por = (select auth.uid())
                or actividad.creada_por is null
              )
            )
            or (
              persona.usuario_id is null
              and (
                actividad.creada_por = (select auth.uid())
                or (
                  actividad.creada_por is null
                  and miembro.rol = 'propietaria'
                )
              )
            )
          )
        )
      )
  );
$$;

-- Valida tanto una inserción nueva (autor actual) como una edición de un plan
-- infantil antiguo (autor null). Los perfiles de adultos vinculados no pueden
-- publicar planes compartidos desde esta primera versión.
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
      and (
        (
          persona.tipo_persona = 'menor'
          and (
            autor_actividad = (select auth.uid())
            or autor_actividad is null
          )
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
                autor_actividad = (select auth.uid())
                or autor_actividad is null
              )
              and (
                visibilidad_actividad = 'privada'
                or autor_actividad is null
              )
            )
            or (
              persona.usuario_id is null
              and (
                (
                  autor_actividad = (select auth.uid())
                  and visibilidad_actividad in ('privada', 'compartida')
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

revoke all on function public.proteger_identidad_persona()
  from public;
revoke all on function public.evitar_mover_actividad_entre_familias()
  from public;
revoke all on function public.puede_ver_actividad(uuid)
  from public;
revoke all on function public.puede_editar_actividad(uuid)
  from public;
revoke all on function public.puede_guardar_actividad(uuid, uuid, text)
  from public;

grant execute on function public.proteger_identidad_persona()
  to authenticated;
grant execute on function public.evitar_mover_actividad_entre_familias()
  to authenticated;
grant execute on function public.puede_ver_actividad(uuid)
  to authenticated;
grant execute on function public.puede_editar_actividad(uuid)
  to authenticated;
grant execute on function public.puede_guardar_actividad(uuid, uuid, text)
  to authenticated;

drop policy if exists "Miembros pueden gestionar actividades"
  on public.actividades;

create policy "Miembros pueden consultar actividades permitidas"
on public.actividades
for select
to authenticated
using (public.puede_ver_actividad(id));

create policy "Miembros pueden crear actividades permitidas"
on public.actividades
for insert
to authenticated
with check (
  creada_por = (select auth.uid())
  and public.puede_guardar_actividad(persona_id, creada_por, visibilidad)
);

create policy "Autores pueden editar actividades permitidas"
on public.actividades
for update
to authenticated
using (public.puede_editar_actividad(id))
with check (
  public.puede_guardar_actividad(persona_id, creada_por, visibilidad)
);

create policy "Usuarios pueden borrar actividades permitidas"
on public.actividades
for delete
to authenticated
using (public.puede_editar_actividad(id));
