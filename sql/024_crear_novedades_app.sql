-- Guarda el contenido de los avisos que se muestran al estrenar una versión.
-- Las usuarias pueden leer las novedades publicadas, pero solo una
-- administradora puede crearlas, editarlas o eliminarlas.

create table public.novedades_app (
  id uuid primary key default gen_random_uuid(),

  version text not null unique
    check (char_length(trim(version)) between 1 and 30),

  titulo text not null default 'Atempo se ha actualizado'
    check (char_length(trim(titulo)) between 1 and 100),

  cambios text[] not null
    check (cardinality(cambios) between 1 and 10),

  activa boolean not null default true,

  publicada_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index novedades_app_publicada_at_idx
  on public.novedades_app(publicada_at desc);

create trigger actualizar_novedades_app_updated_at
before update on public.novedades_app
for each row
execute function public.actualizar_updated_at();

alter table public.novedades_app enable row level security;

revoke all on table public.novedades_app from anon;
revoke all on table public.novedades_app from authenticated;

grant select, insert, update, delete
on table public.novedades_app
to authenticated;

create policy "Usuarios leen novedades publicadas"
on public.novedades_app
for select
to authenticated
using (
  (
    activa = true
    and publicada_at <= now()
  )
  or exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
);

create policy "Administradoras crean novedades"
on public.novedades_app
for insert
to authenticated
with check (
  exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
);

create policy "Administradoras editan novedades"
on public.novedades_app
for update
to authenticated
using (
  exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
);

create policy "Administradoras eliminan novedades"
on public.novedades_app
for delete
to authenticated
using (
  exists (
    select 1
    from public.administradores
    where administradores.usuario_id = (select auth.uid())
  )
);
