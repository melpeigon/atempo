-- Guarda errores técnicos ocurridos mientras una usuaria utiliza Atempo.
-- No debe almacenar contraseñas, actividades ni información familiar.

create table public.errores_app (
  id uuid primary key default gen_random_uuid(),

  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,

  contexto text not null
    check (char_length(contexto) between 1 and 80),

  mensaje text not null
    check (char_length(mensaje) between 1 and 500),

  codigo text
    check (
      codigo is null
      or char_length(codigo) <= 80
    ),

  version_app text
    check (
      version_app is null
      or char_length(version_app) <= 30
    ),

  plataforma text
    check (
      plataforma is null
      or char_length(plataforma) <= 100
    ),

  pagina text
    check (
      pagina is null
      or char_length(pagina) <= 500
    ),

  created_at timestamptz not null default now()
);

create index errores_app_usuario_id_idx
  on public.errores_app(usuario_id);

create index errores_app_created_at_idx
  on public.errores_app(created_at desc);

alter table public.errores_app enable row level security;

revoke all on table public.errores_app from anon;
revoke all on table public.errores_app from authenticated;

grant insert on table public.errores_app to authenticated;

create policy "Cada usuario registra sus propios errores"
on public.errores_app
for insert
to authenticated
with check (
  usuario_id = (select auth.uid())
);