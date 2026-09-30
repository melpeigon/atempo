create table public.avisos_enviados (

  id uuid primary key default gen_random_uuid(),

  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,

  actividad_id uuid
    references public.actividades(id)
    on delete cascade,

  clave text not null,

  tipo text not null
    check (tipo in ('actividad', 'resumen')),

  fecha_actividad date,

  enviado_at timestamptz not null default now(),

  unique (usuario_id, clave)
);