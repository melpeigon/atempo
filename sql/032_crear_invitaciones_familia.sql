-- Invitaciones de un solo uso para incorporar adultos a una familia.
-- El enlace no se guarda en claro: token_hash almacenará su hash SHA-256.
-- La app no tendrá acceso directo a esta tabla; las operaciones se harán
-- mediante funciones SQL seguras que añadiremos en el siguiente paso.

create table public.invitaciones_familia (
  id uuid primary key default gen_random_uuid(),

  familia_id uuid not null
    references public.familias(id)
    on delete cascade,

  email_invitado text not null
    check (char_length(trim(email_invitado)) between 3 and 320),

  token_hash text not null unique
    check (token_hash ~ '^[a-f0-9]{64}$'),

  creada_por uuid not null
    references auth.users(id)
    on delete cascade,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid
    references auth.users(id)
    on delete set null,
  revoked_at timestamptz,

  constraint invitaciones_familia_expira_despues_de_crearse
    check (expires_at > created_at),

  constraint invitaciones_familia_no_aceptada_y_revocada
    check (accepted_at is null or revoked_at is null)
);

create index invitaciones_familia_familia_id_idx
  on public.invitaciones_familia (familia_id);

create index invitaciones_familia_creada_por_idx
  on public.invitaciones_familia (creada_por);

alter table public.invitaciones_familia enable row level security;

-- El cliente no puede leer ni modificar invitaciones directamente.
-- Las próximas funciones SECURITY DEFINER validarán cada operación.
revoke all on table public.invitaciones_familia from anon, authenticated;
