create table public.configuracion_notificaciones (
  usuario_id uuid primary key
    references auth.users(id)
    on delete cascade,

  modo text not null default 'solo-actividades'
    check (
      modo in (
        'solo-actividades',
        'solo-resumen',
        'resumen-y-actividades'
      )
    ),

  hora_resumen time not null default '08:00',

  updated_at timestamptz not null default now()
);