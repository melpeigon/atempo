create table public.personas (
  id uuid primary key default gen_random_uuid(),

  familia_id uuid not null
    references public.familias(id)
    on delete cascade,

  nombre text not null
    check (char_length(trim(nombre)) between 1 and 50),

  color text not null,

  icono text not null
    check (icono in ('mujer', 'nino', 'bebe', 'hombre')),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);