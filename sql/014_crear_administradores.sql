-- Cuentas autorizadas para entrar en el panel privado de Atempo.

create table public.administradores (
  usuario_id uuid primary key
    references auth.users(id)
    on delete cascade,

  created_at timestamptz not null default now()
);

alter table public.administradores enable row level security;

revoke all on table public.administradores from anon;
revoke insert, update, delete on table public.administradores from authenticated;
grant select on table public.administradores to authenticated;

create policy "Cada administradora puede comprobar su acceso"
on public.administradores
for select
to authenticated
using (usuario_id = (select auth.uid()));

-- Después de ejecutar este archivo, añade tu cuenta desde el SQL Editor:
--
insert into public.administradores (usuario_id)
values ('9845141b-b8c3-42e6-b0a0-09b206af9043');
