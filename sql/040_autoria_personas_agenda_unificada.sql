-- Identifica quién creó cada ficha para que, en la agenda conjunta,
-- cada adulto solo pueda borrar las fichas que creó.
-- Las fichas anteriores no guardaban autoría. Solo se asigna autoría
-- automáticamente cuando el adulto está vinculado o la agenda aún tiene
-- un único miembro; los registros ambiguos quedan sin autor.

begin;

alter table public.personas
  add column if not exists creada_por uuid
  references auth.users(id) on delete set null;

update public.personas as persona
set creada_por = coalesce(
  persona.usuario_id,
  (
    select miembro.usuario_id
    from public.miembros_familia as miembro
    where miembro.familia_id = persona.familia_id
      and (
        select count(*)
        from public.miembros_familia as todos
        where todos.familia_id = persona.familia_id
      ) = 1
    limit 1
  )
)
where persona.creada_por is null;

create or replace function public.preparar_autoria_persona()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.creada_por := (select auth.uid());
  else
    new.creada_por := old.creada_por;
  end if;

  return new;
end;
$$;

drop trigger if exists preparar_autoria_persona_antes_de_guardar
  on public.personas;
create trigger preparar_autoria_persona_antes_de_guardar
before insert or update on public.personas
for each row execute function public.preparar_autoria_persona();

revoke all on function public.preparar_autoria_persona()
  from public, anon, authenticated;

drop policy if exists "Miembros eliminan perfiles permitidos"
  on public.personas;
create policy "Creadores eliminan sus propios perfiles"
on public.personas for delete to authenticated
using (
  public.puede_editar_persona(id)
  and (
    creada_por = (select auth.uid())
    or (
      creada_por is null
      and exists (
        select 1
        from public.miembros_familia as miembro
        where miembro.familia_id = personas.familia_id
          and miembro.usuario_id = (select auth.uid())
          and miembro.rol = 'propietaria'
      )
    )
  )
);

notify pgrst, 'reload schema';

commit;
