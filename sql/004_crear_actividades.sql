create table public.actividades (
  id uuid primary key default gen_random_uuid(),

  persona_id uuid not null
    references public.personas(id)
    on delete cascade,

  tipo_actividad text not null
    check (
      tipo_actividad in (
        'musica',
        'catequesis',
        'futbol',
        'cumple',
        'peluqueria',
        'dentista',
        'ingles',
        'padel',
        'gym',
        'medico',
        'personalizada'
      )
    ),

  nombre_personalizado text
    check (
      nombre_personalizado is null
      or char_length(trim(nombre_personalizado)) between 1 and 80
    ),

  fecha_inicio date not null,

  hora time not null,

  recurrencia text not null
    check (
      recurrencia in (
        'puntual',
        'semanal',
        'mensual',
        'anual'
      )
    ),

  dias text[] not null default '{}',

  tipo_aviso text not null default 'sin-aviso'
    check (
      tipo_aviso in (
        'sin-aviso',
        'una-hora-antes',
        'un-dia-antes',
        'hora-concreta'
      )
    ),

  hora_aviso time,

  incluir_resumen boolean not null default true,

  recordatorio text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
