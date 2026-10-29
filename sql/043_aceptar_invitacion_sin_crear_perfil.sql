-- Aceptar una invitación añade la membresía y los perfiles autorizados.
-- No crea una ficha adulta duplicada en la agenda compartida.

begin;

create or replace function public.aceptar_invitacion_familia(
  token_invitacion text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario_actual uuid := (select auth.uid());
  correo_actual text;
  invitacion public.invitaciones_familia%rowtype;
  familia_aceptada uuid;
begin
  if usuario_actual is null then
    raise exception 'Inicia sesión para aceptar la invitación';
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

  insert into public.permisos_personas_miembro (
    familia_id, persona_id, usuario_id, concedido_por, invitacion_id
  )
  select invitacion.familia_id, perfil.persona_id, usuario_actual,
         invitacion.creada_por, invitacion.id
  from public.invitaciones_familia_perfiles as perfil
  where perfil.invitacion_id = invitacion.id
    and perfil.familia_id = invitacion.familia_id;

  update public.invitaciones_familia
  set accepted_at = now(),
      accepted_by = usuario_actual
  where id = invitacion.id;

  familia_aceptada := invitacion.familia_id;
  return familia_aceptada;
end;
$$;

drop function if exists public.aceptar_invitacion_familia(text, text, text, text);
revoke all on function public.aceptar_invitacion_familia(text)
  from public, anon, authenticated;
grant execute on function public.aceptar_invitacion_familia(text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
