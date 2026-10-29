-- Al aceptar una invitación, la persona invitada puede permitir que quien
-- invita edite sus actividades compartidas. No crea fichas de personas.

begin;

drop function if exists public.aceptar_invitacion_familia(text);
drop function if exists public.aceptar_invitacion_familia(text, text, text, text);
drop function if exists public.aceptar_invitacion_familia(text, boolean);

create function public.aceptar_invitacion_familia(
  token_invitacion text,
  permitir_edicion_invitada boolean
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

  if coalesce(permitir_edicion_invitada, false) then
    insert into public.permisos_edicion_actividades (
      familia_id, creador_id, editor_id, concedido_por
    )
    values (
      invitacion.familia_id,
      usuario_actual,
      invitacion.creada_por,
      usuario_actual
    )
    on conflict (familia_id, creador_id, editor_id)
    do update set concedido_por = excluded.concedido_por;
  else
    delete from public.permisos_edicion_actividades as permiso
    where permiso.familia_id = invitacion.familia_id
      and permiso.creador_id = usuario_actual
      and permiso.editor_id = invitacion.creada_por;
  end if;

  return invitacion.familia_id;
end;
$$;

revoke all on function public.aceptar_invitacion_familia(text, boolean)
  from public, anon, authenticated;
grant execute on function public.aceptar_invitacion_familia(text, boolean)
  to authenticated;

notify pgrst, 'reload schema';

commit;
