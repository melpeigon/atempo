-- Funciones seguras para crear y aceptar invitaciones a una agenda.
-- Requiere 032_crear_invitaciones_familia.sql y 033-035.
-- Aceptar una invitación añade membresía y perfil adulto; no borra ni mueve
-- ninguna agenda, persona o actividad preexistente de la cuenta invitada.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.crear_invitacion_familia(
  familia_consultada uuid,
  correo_invitado text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo_normalizado text;
  token_nuevo text;
  caduca_en timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para crear una invitación';
  end if;

  correo_normalizado := lower(trim(correo_invitado));
  if correo_normalizado is null
     or char_length(correo_normalizado) not between 3 and 320
     or correo_normalizado !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Escribe un correo electrónico válido';
  end if;

  if not exists (
    select 1
    from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = (select auth.uid())
      and miembro.rol = 'propietaria'
  ) then
    raise exception 'Solo una persona propietaria puede invitar a esta agenda';
  end if;

  if exists (
    select 1
    from auth.users as usuario
    join public.miembros_familia as miembro
      on miembro.usuario_id = usuario.id
    where miembro.familia_id = familia_consultada
      and lower(usuario.email) = correo_normalizado
  ) then
    raise exception 'Esa cuenta ya pertenece a esta agenda';
  end if;

  -- Un enlace nuevo invalida los anteriores aún pendientes para ese correo.
  update public.invitaciones_familia as invitacion
  set revoked_at = now()
  where invitacion.familia_id = familia_consultada
    and lower(invitacion.email_invitado) = correo_normalizado
    and invitacion.accepted_at is null
    and invitacion.revoked_at is null
    and invitacion.expires_at > now();

  token_nuevo := encode(extensions.gen_random_bytes(32), 'hex');
  caduca_en := now() + interval '7 days';

  insert into public.invitaciones_familia (
    familia_id,
    email_invitado,
    token_hash,
    creada_por,
    expires_at
  )
  values (
    familia_consultada,
    correo_normalizado,
    encode(extensions.digest(convert_to(token_nuevo, 'UTF8'), 'sha256'), 'hex'),
    (select auth.uid()),
    caduca_en
  );

  -- El token legible solo se devuelve en esta respuesta; en la tabla queda
  -- almacenado exclusivamente su hash.
  return jsonb_build_object(
    'token', token_nuevo,
    'email', correo_normalizado,
    'expires_at', caduca_en
  );
end;
$$;

create or replace function public.aceptar_invitacion_familia(
  token_invitacion text,
  nombre_adulto text,
  icono_adulto text,
  color_adulto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario_actual uuid;
  correo_actual text;
  invitacion public.invitaciones_familia%rowtype;
  familia_aceptada uuid;
begin
  usuario_actual := (select auth.uid());
  if usuario_actual is null then
    raise exception 'Inicia sesión para aceptar la invitación';
  end if;

  if char_length(trim(coalesce(nombre_adulto, ''))) not between 1 and 50 then
    raise exception 'El nombre debe tener entre 1 y 50 caracteres';
  end if;

  if icono_adulto not in ('mujer', 'hombre', 'abuela', 'abuelo') then
    raise exception 'Elige un icono de persona adulta';
  end if;

  if char_length(trim(coalesce(color_adulto, ''))) not between 1 and 40 then
    raise exception 'Elige un color para tu perfil';
  end if;

  select lower(usuario.email)
    into correo_actual
    from auth.users as usuario
    where usuario.id = usuario_actual
      and usuario.email_confirmed_at is not null;

  if correo_actual is null then
    raise exception 'Confirma tu correo e inicia sesión antes de aceptar';
  end if;

  if token_invitacion is null or token_invitacion !~ '^[a-f0-9]{64}$' then
    raise exception 'El enlace de invitación no es válido';
  end if;

  select *
    into invitacion
    from public.invitaciones_familia as registro
    where registro.token_hash = encode(
      extensions.digest(convert_to(token_invitacion, 'UTF8'), 'sha256'),
      'hex'
    )
    for update;

  if not found then
    raise exception 'El enlace de invitación no es válido o ya se utilizó';
  end if;

  if invitacion.revoked_at is not null
     or invitacion.accepted_at is not null
     or invitacion.expires_at <= now() then
    raise exception 'El enlace ha caducado o ya no está activo';
  end if;

  if lower(invitacion.email_invitado) <> correo_actual then
    raise exception 'Entra con el correo al que se envió esta invitación';
  end if;

  if exists (
    select 1
    from public.miembros_familia as miembro
    where miembro.familia_id = invitacion.familia_id
      and miembro.usuario_id = usuario_actual
  ) then
    raise exception 'Ya perteneces a esta agenda';
  end if;

  insert into public.miembros_familia (familia_id, usuario_id, rol)
  values (invitacion.familia_id, usuario_actual, 'miembro');

  insert into public.personas (
    familia_id,
    nombre,
    color,
    icono,
    tipo_persona,
    usuario_id
  )
  values (
    invitacion.familia_id,
    trim(nombre_adulto),
    trim(color_adulto),
    icono_adulto,
    'adulto',
    usuario_actual
  );

  update public.invitaciones_familia
  set accepted_at = now(),
      accepted_by = usuario_actual
  where id = invitacion.id;

  familia_aceptada := invitacion.familia_id;
  return familia_aceptada;
end;
$$;

revoke all on function public.crear_invitacion_familia(uuid, text)
  from public, anon, authenticated;
revoke all on function public.aceptar_invitacion_familia(text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.crear_invitacion_familia(uuid, text)
  to authenticated;
grant execute on function public.aceptar_invitacion_familia(text, text, text, text)
  to authenticated;

commit;
