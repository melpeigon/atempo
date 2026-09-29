-- =========================================================
-- FUNCIONES DE SEGURIDAD
-- =========================================================

create or replace function public.es_miembro_familia(
  familia_consultada uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.miembros_familia
    where familia_id = familia_consultada
      and usuario_id = (select auth.uid())
  );
$$;

create or replace function public.es_propietaria_familia(
  familia_consultada uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.miembros_familia
    where familia_id = familia_consultada
      and usuario_id = (select auth.uid())
      and rol = 'propietaria'
  );
$$;

create or replace function public.es_miembro_persona(
  persona_consultada uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas
    join public.miembros_familia
      on miembros_familia.familia_id = personas.familia_id
    where personas.id = persona_consultada
      and miembros_familia.usuario_id = (select auth.uid())
  );
$$;

revoke all
on function public.es_miembro_familia(uuid)
from public;

revoke all
on function public.es_propietaria_familia(uuid)
from public;

revoke all
on function public.es_miembro_persona(uuid)
from public;

grant execute
on function public.es_miembro_familia(uuid)
to authenticated;

grant execute
on function public.es_propietaria_familia(uuid)
to authenticated;

grant execute
on function public.es_miembro_persona(uuid)
to authenticated;


-- =========================================================
-- PERMISOS DE LAS TABLAS
-- =========================================================

grant select, insert, update, delete
on table
  public.familias,
  public.miembros_familia,
  public.personas,
  public.actividades,
  public.configuracion_notificaciones,
  public.dispositivos_notificaciones
to authenticated;


-- =========================================================
-- ASEGURAR QUE RLS ESTÁ ACTIVADO
-- =========================================================

alter table public.familias enable row level security;
alter table public.miembros_familia enable row level security;
alter table public.personas enable row level security;
alter table public.actividades enable row level security;
alter table public.configuracion_notificaciones enable row level security;
alter table public.dispositivos_notificaciones enable row level security;


-- =========================================================
-- POLÍTICAS DE FAMILIAS
-- =========================================================

create policy "Miembros pueden ver su familia"
on public.familias
for select
to authenticated
using (
  public.es_miembro_familia(id)
);

create policy "Propietarias pueden editar su familia"
on public.familias
for update
to authenticated
using (
  public.es_propietaria_familia(id)
)
with check (
  public.es_propietaria_familia(id)
);

create policy "Propietarias pueden eliminar su familia"
on public.familias
for delete
to authenticated
using (
  public.es_propietaria_familia(id)
);


-- =========================================================
-- POLÍTICAS DE MIEMBROS
-- =========================================================

create policy "Miembros pueden ver los miembros de su familia"
on public.miembros_familia
for select
to authenticated
using (
  public.es_miembro_familia(familia_id)
);

create policy "Propietarias pueden añadir miembros"
on public.miembros_familia
for insert
to authenticated
with check (
  public.es_propietaria_familia(familia_id)
);

create policy "Propietarias pueden editar miembros"
on public.miembros_familia
for update
to authenticated
using (
  public.es_propietaria_familia(familia_id)
)
with check (
  public.es_propietaria_familia(familia_id)
);

create policy "Propietarias pueden eliminar miembros"
on public.miembros_familia
for delete
to authenticated
using (
  public.es_propietaria_familia(familia_id)
);


-- =========================================================
-- POLÍTICAS DE PERSONAS
-- =========================================================

create policy "Miembros pueden gestionar personas"
on public.personas
for all
to authenticated
using (
  public.es_miembro_familia(familia_id)
)
with check (
  public.es_miembro_familia(familia_id)
);


-- =========================================================
-- POLÍTICAS DE ACTIVIDADES
-- =========================================================

create policy "Miembros pueden gestionar actividades"
on public.actividades
for all
to authenticated
using (
  public.es_miembro_persona(persona_id)
)
with check (
  public.es_miembro_persona(persona_id)
);


-- =========================================================
-- POLÍTICAS DE CONFIGURACIÓN
-- =========================================================

create policy "Usuarios gestionan su configuracion"
on public.configuracion_notificaciones
for all
to authenticated
using (
  usuario_id = (select auth.uid())
)
with check (
  usuario_id = (select auth.uid())
);


-- =========================================================
-- POLÍTICAS DE DISPOSITIVOS
-- =========================================================

create policy "Usuarios gestionan sus dispositivos"
on public.dispositivos_notificaciones
for all
to authenticated
using (
  usuario_id = (select auth.uid())
)
with check (
  usuario_id = (select auth.uid())
);