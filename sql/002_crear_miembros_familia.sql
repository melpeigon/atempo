create table public.miembros_familia (
  id uuid primary key default gen_random_uuid(),

  familia_id uuid not null
    references public.familias(id)
    on delete cascade,

  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,

  rol text not null
    default 'propietaria'
    check (rol in ('propietaria', 'miembro')),

  created_at timestamptz not null default now(),

  unique (familia_id, usuario_id)
);