create table public.dispositivos_notificaciones (
  id uuid primary key default gen_random_uuid(),

  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,

  endpoint text not null unique,

  clave_p256dh text not null,

  clave_auth text not null,

  nombre_dispositivo text,

  activo boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);