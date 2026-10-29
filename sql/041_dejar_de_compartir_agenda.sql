-- Permite a la propietaria retirar a un adulto de una agenda compartida.
-- La propietaria elige transferir o eliminar los planes compartidos que ese
-- adulto creó para menores. No modifica planes privados ni actividades adultas.

begin;

-- El marcador vive en un esquema privado y solo lo escriben las funciones
-- SECURITY DEFINER de esta migración. No se usa un GUC como autorización:
-- cualquier cliente autenticado podría asignarse ese valor manualmente.
create schema if not exists atempo_private;
revoke all on schema atempo_private from public, anon, authenticated;

create table if not exists atempo_private.transferencias_autoria_actividad (
  transaccion_id bigint not null,
  actividad_id uuid not null,
  familia_id uuid not null,
  autor_anterior uuid not null,
  autor_nuevo uuid not null,
  solicitante uuid not null,
  primary key (transaccion_id, actividad_id)
);

alter table atempo_private.transferencias_autoria_actividad
  enable row level security;

revoke all on table atempo_private.transferencias_autoria_actividad
  from public, anon, authenticated;

create or replace function public.preparar_autoria_actividad()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  familia_persona uuid;
  tipo_persona text;
  usuario_persona uuid;
  hay_otra_persona_con_acceso boolean;
  transferencia_autorizada boolean;
begin
  if tg_op = 'INSERT' then
    new.creada_por := (select auth.uid());

    select persona.familia_id, persona.tipo_persona, persona.usuario_id
      into familia_persona, tipo_persona, usuario_persona
      from public.personas as persona
      where persona.id = new.persona_id;

    if new.visibilidad is null then
      select exists (
        select 1
        from public.miembros_familia as miembro
        where miembro.familia_id = familia_persona
          and miembro.usuario_id <> (select auth.uid())
          and (
            exists (
              select 1 from public.permisos_personas_miembro as permiso
              where permiso.familia_id = familia_persona
                and permiso.persona_id = new.persona_id
                and permiso.usuario_id = miembro.usuario_id
            )
            or (
              miembro.rol = 'propietaria'
              and (tipo_persona = 'menor' or usuario_persona is null)
            )
          )
      ) into hay_otra_persona_con_acceso;

      new.visibilidad := case when hay_otra_persona_con_acceso
        then 'compartida' else 'privada' end;
    end if;
  else
    select persona.familia_id
      into familia_persona
      from public.personas as persona
      where persona.id = new.persona_id;

    select exists (
      select 1
      from atempo_private.transferencias_autoria_actividad as transferencia
      join public.personas as persona
        on persona.id = new.persona_id
       and persona.familia_id = transferencia.familia_id
       and persona.tipo_persona = 'menor'
      join public.miembros_familia as propietaria
        on propietaria.familia_id = transferencia.familia_id
       and propietaria.usuario_id = transferencia.solicitante
       and propietaria.rol = 'propietaria'
      where transferencia.transaccion_id = pg_catalog.txid_current()
        and transferencia.actividad_id = old.id
        and transferencia.autor_anterior = old.creada_por
        and transferencia.autor_nuevo = new.creada_por
        and transferencia.autor_nuevo = (select auth.uid())
        and transferencia.solicitante = (select auth.uid())
        and transferencia.familia_id = familia_persona
        and old.visibilidad = 'compartida'
        and new.visibilidad = 'compartida'
    ) into transferencia_autorizada;

    if transferencia_autorizada then
      delete from atempo_private.transferencias_autoria_actividad as transferencia
      where transferencia.transaccion_id = pg_catalog.txid_current()
        and transferencia.actividad_id = old.id;
    else
      new.creada_por := old.creada_por;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.preparar_autoria_actividad()
  from public, anon, authenticated;

create or replace function public.retirar_miembro_agenda(
  familia_consultada uuid,
  usuario_destino uuid,
  accion_planes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario_propietario uuid := (select auth.uid());
  total_planes integer := 0;
begin
  if usuario_propietario is null then
    raise exception 'Inicia sesión para dejar de compartir la agenda';
  end if;

  if accion_planes not in ('conservar', 'eliminar') then
    raise exception 'Elige si quieres conservar o eliminar los planes compartidos';
  end if;

  if not exists (
    select 1
    from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_propietario
      and miembro.rol = 'propietaria'
  ) then
    raise exception 'Solo la propietaria puede retirar a un adulto de esta agenda';
  end if;

  if usuario_destino = usuario_propietario or not exists (
    select 1
    from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_destino
      and miembro.rol = 'miembro'
  ) then
    raise exception 'Elige un adulto invitado que siga perteneciendo a esta agenda';
  end if;

  if accion_planes = 'conservar' then
    insert into atempo_private.transferencias_autoria_actividad (
      transaccion_id,
      actividad_id,
      familia_id,
      autor_anterior,
      autor_nuevo,
      solicitante
    )
    select
      pg_catalog.txid_current(),
      actividad.id,
      familia_consultada,
      actividad.creada_por,
      usuario_propietario,
      usuario_propietario
    from public.actividades as actividad
    join public.personas as persona on persona.id = actividad.persona_id
    where persona.familia_id = familia_consultada
      and persona.tipo_persona = 'menor'
      and actividad.creada_por = usuario_destino
      and actividad.visibilidad = 'compartida';

    update public.actividades as actividad
    set creada_por = usuario_propietario
    from public.personas as persona
    where persona.id = actividad.persona_id
      and persona.familia_id = familia_consultada
      and persona.tipo_persona = 'menor'
      and actividad.creada_por = usuario_destino
      and actividad.visibilidad = 'compartida';

    get diagnostics total_planes = row_count;

    delete from atempo_private.transferencias_autoria_actividad as transferencia
    where transferencia.transaccion_id = pg_catalog.txid_current();
  else
    delete from public.actividades as actividad
    using public.personas as persona
    where persona.id = actividad.persona_id
      and persona.familia_id = familia_consultada
      and persona.tipo_persona = 'menor'
      and actividad.creada_por = usuario_destino
      and actividad.visibilidad = 'compartida';

    get diagnostics total_planes = row_count;
  end if;

  -- El adulto deja de poder consultar su propio perfil personal desde esta
  -- agenda; el perfil y sus datos personales no se borran.
  delete from public.permisos_personas_miembro as permiso
  using public.personas as persona
  where permiso.familia_id = familia_consultada
    and permiso.persona_id = persona.id
    and persona.familia_id = familia_consultada
    and persona.usuario_id = usuario_destino;

  -- Las demás autorizaciones del miembro desaparecen por las claves foráneas
  -- al quitar su membresía. La familia, los perfiles y los datos privados se conservan.
  delete from public.miembros_familia as miembro
  where miembro.familia_id = familia_consultada
    and miembro.usuario_id = usuario_destino
    and miembro.rol = 'miembro';

  if not found then
    raise exception 'No se pudo retirar al adulto de esta agenda';
  end if;

  return jsonb_build_object(
    'accion', accion_planes,
    'planes_procesados', total_planes
  );
end;
$$;

revoke all on function public.retirar_miembro_agenda(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.retirar_miembro_agenda(uuid, uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
