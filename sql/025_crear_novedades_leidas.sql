-- Registra qué usuaria ha confirmado cada aviso de actualización.
-- La restricción unique evita duplicados si utiliza varios dispositivos.

create table public.novedades_leidas (
  id uuid primary key default gen_random_uuid(),

  novedad_id uuid not null
    references public.novedades_app(id)
    on delete cascade,

  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,

  leida_at timestamptz not null default now(),

  unique (novedad_id, usuario_id)
);

create index novedades_leidas_usuario_id_idx
  on public.novedades_leidas(usuario_id);

create index novedades_leidas_novedad_id_idx
  on public.novedades_leidas(novedad_id);

alter table public.novedades_leidas enable row level security;

revoke all on table public.novedades_leidas from anon;
revoke all on table public.novedades_leidas from authenticated;

grant select, insert
on table public.novedades_leidas
to authenticated;

create policy "Usuarios consultan sus confirmaciones"
on public.novedades_leidas
for select
to authenticated
using (
  usuario_id = (select auth.uid())
  or exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
);

create policy "Usuarios confirman sus novedades"
on public.novedades_leidas
for insert
to authenticated
with check (
  usuario_id = (select auth.uid())
);
