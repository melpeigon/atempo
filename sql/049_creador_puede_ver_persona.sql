-- Permite que quien crea un perfil pueda leerlo inmediatamente.
-- La app usa INSERT ... SELECT para recibir la ficha recién creada.
-- No concede acceso a otros miembros: siguen aplicándose los permisos existentes.

begin;

create or replace function public.puede_ver_persona(persona_consultada uuid)
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
        persona.creada_por = (select auth.uid())
        or persona.usuario_id = (select auth.uid())
        or exists (
          select 1
          from public.permisos_personas_miembro as permiso
          where permiso.familia_id = persona.familia_id
            and permiso.persona_id = persona.id
            and permiso.usuario_id = (select auth.uid())
        )
        or (
          miembro.rol = 'propietaria'
          and (
            persona.tipo_persona = 'menor'
            or persona.usuario_id is null
          )
        )
      )
  );
$$;

-- La condición directa cubre la fila INSERT ... RETURNING sin depender de
-- que la función SECURITY DEFINER vuelva a localizarla durante esa petición.
drop policy if exists "Miembros ven perfiles propios o compartidos"
  on public.personas;

create policy "Miembros ven perfiles propios o compartidos"
on public.personas
for select
to authenticated
using (
  (
    public.es_miembro_familia(familia_id)
    and creada_por = (select auth.uid())
  )
  or public.puede_ver_persona(id)
);

notify pgrst, 'reload schema';

commit;
