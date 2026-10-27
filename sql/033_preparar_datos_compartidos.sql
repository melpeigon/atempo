-- Primera fase de la actualización para compartir agendas.
-- Añade metadatos sin cambiar todavía las políticas RLS actuales.
-- No activar invitaciones hasta completar y probar las nuevas políticas RLS.

-- Distingue perfiles adultos y menores. Para los perfiles existentes,
-- el icono solo sugiere el tipo inicial; después podrá corregirse en Atempo.
alter table public.personas
add column tipo_persona text;

update public.personas
set tipo_persona = case
  when icono in ('mujer', 'hombre', 'abuela', 'abuelo') then 'adulto'
  else 'menor'
end
where tipo_persona is null;

create or replace function public.inferir_tipo_persona()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tipo_persona is null then
    new.tipo_persona := case
      when new.icono in ('mujer', 'hombre', 'abuela', 'abuelo') then 'adulto'
      else 'menor'
    end;
  end if;

  return new;
end;
$$;

create trigger inferir_tipo_persona_antes_de_insertar
before insert on public.personas
for each row
execute function public.inferir_tipo_persona();

alter table public.personas
alter column tipo_persona set not null;

alter table public.personas
add constraint personas_tipo_persona_check
check (tipo_persona in ('adulto', 'menor'));

alter table public.personas
add column usuario_id uuid
references auth.users(id)
on delete set null;

alter table public.personas
add constraint personas_usuario_solo_adulto_check
check (usuario_id is null or tipo_persona = 'adulto');

create unique index personas_familia_usuario_unico_idx
on public.personas (familia_id, usuario_id)
where usuario_id is not null;

-- La autoría y la visibilidad de datos antiguos se dejan sin rellenar por ahora:
-- son planes anteriores al sistema de permisos y se tratarán como legado.
alter table public.actividades
add column creada_por uuid
references auth.users(id)
on delete set null;

alter table public.actividades
add column visibilidad text
check (visibilidad in ('privada', 'compartida'));

create index actividades_creada_por_idx
on public.actividades (creada_por);

create or replace function public.preparar_autoria_actividad()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  usuario_persona uuid;
begin
  if tg_op = 'INSERT' then
    new.creada_por := (select auth.uid());

    if new.visibilidad is null then
      select personas.usuario_id
      into usuario_persona
      from public.personas
      where personas.id = new.persona_id;

      if usuario_persona is not null
         and usuario_persona = (select auth.uid()) then
        new.visibilidad := 'privada';
      else
        new.visibilidad := 'compartida';
      end if;
    end if;
  else
    -- La cuenta creadora no se puede cambiar al editar una actividad.
    new.creada_por := old.creada_por;
  end if;

  return new;
end;
$$;

create trigger preparar_autoria_actividad_antes_de_guardar
before insert or update on public.actividades
for each row
execute function public.preparar_autoria_actividad();
