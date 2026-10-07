-- Guarda el último uso conocido de Atempo para cada cuenta.
-- Hay una sola fila por usuario; cada apertura actualiza esa misma fila.

create table public.actividad_usuarios (
  usuario_id uuid primary key
    references auth.users(id)
    on delete cascade,

  ultima_apertura timestamptz not null default now(),
  version_app text not null,
  plataforma text,
  instalada boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.actividad_usuarios enable row level security;

revoke all on table public.actividad_usuarios from anon;
grant select, insert, update on table public.actividad_usuarios to authenticated;

create policy "Cada usuario puede consultar su actividad"
on public.actividad_usuarios
for select
to authenticated
using (usuario_id = (select auth.uid()));

create policy "Cada usuario puede registrar su actividad"
on public.actividad_usuarios
for insert
to authenticated
with check (usuario_id = (select auth.uid()));

create policy "Cada usuario puede actualizar su actividad"
on public.actividad_usuarios
for update
to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()));

create trigger actualizar_actividad_usuarios_updated_at
before update on public.actividad_usuarios
for each row
execute function public.actualizar_updated_at();
