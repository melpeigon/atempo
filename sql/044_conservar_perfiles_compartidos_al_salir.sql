-- Al salir de una agenda compartida, el adulto puede llevar una copia de los
-- perfiles infantiles visibles y de sus actividades a su agenda propia.
-- Los originales permanecen en la agenda compartida para el resto de miembros.

begin;

drop function if exists public.salir_de_agenda_compartida(uuid, text);

create function public.salir_de_agenda_compartida(
  familia_consultada uuid,
  accion_salida text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario_actual uuid := (select auth.uid());
  agenda_propia uuid;
  total_agendas_propias integer := 0;
  total_perfiles integer := 0;
  total_planes integer := 0;
  planes_perfil integer := 0;
  perfil record;
  perfil_copiado uuid;
begin
  if usuario_actual is null then
    raise exception 'Inicia sesión para salir de esta agenda';
  end if;

  if accion_salida is null or accion_salida not in ('conservar', 'no_conservar') then
    raise exception 'Elige si quieres conservar una copia de los perfiles compartidos';
  end if;

  if not exists (
    select 1
    from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_actual
      and miembro.rol = 'miembro'
  ) then
    raise exception 'Solo un adulto invitado puede salir de esta agenda';
  end if;

  if accion_salida = 'conservar' then
    select count(*)
      into total_agendas_propias
      from public.miembros_familia as miembro
      where miembro.usuario_id = usuario_actual
        and miembro.rol = 'propietaria';

    if total_agendas_propias <> 1 then
      raise exception 'No encontramos una única agenda propia donde guardar las copias';
    end if;

    select miembro.familia_id
      into agenda_propia
      from public.miembros_familia as miembro
      where miembro.usuario_id = usuario_actual
        and miembro.rol = 'propietaria';

    if agenda_propia = familia_consultada then
      raise exception 'La agenda compartida no puede ser tu agenda propia';
    end if;

    for perfil in
      select persona.id, persona.nombre, persona.color, persona.icono
      from public.personas as persona
      join public.permisos_personas_miembro as permiso
        on permiso.familia_id = persona.familia_id
       and permiso.persona_id = persona.id
       and permiso.usuario_id = usuario_actual
      where persona.familia_id = familia_consultada
        and persona.tipo_persona = 'menor'
      order by persona.created_at, persona.id
    loop
      insert into public.personas (
        familia_id, nombre, color, icono, tipo_persona, usuario_id
      )
      values (
        agenda_propia, perfil.nombre, perfil.color, perfil.icono, 'menor', null
      )
      returning id into perfil_copiado;

      total_perfiles := total_perfiles + 1;

      insert into public.actividades (
        persona_id,
        tipo_actividad,
        nombre_personalizado,
        fecha_inicio,
        hora,
        hora_fin,
        recurrencia,
        dias,
        tipo_aviso,
        hora_aviso,
        incluir_resumen,
        recordatorio,
        visibilidad
      )
      select
        perfil_copiado,
        actividad.tipo_actividad,
        actividad.nombre_personalizado,
        actividad.fecha_inicio,
        actividad.hora,
        actividad.hora_fin,
        actividad.recurrencia,
        actividad.dias,
        actividad.tipo_aviso,
        actividad.hora_aviso,
        actividad.incluir_resumen,
        actividad.recordatorio,
        'privada'
      from public.actividades as actividad
      where actividad.persona_id = perfil.id
        and (
          actividad.creada_por = usuario_actual
          or actividad.visibilidad = 'compartida'
          or actividad.creada_por is null
        );

      get diagnostics planes_perfil = row_count;
      total_planes := total_planes + planes_perfil;
    end loop;
  end if;

  delete from public.miembros_familia as miembro
  where miembro.familia_id = familia_consultada
    and miembro.usuario_id = usuario_actual
    and miembro.rol = 'miembro';

  if not found then
    raise exception 'No se pudo salir de esta agenda';
  end if;

  return jsonb_build_object(
    'accion', accion_salida,
    'perfiles_copiados', total_perfiles,
    'planes_copiados', total_planes
  );
end;
$$;

revoke all on function public.salir_de_agenda_compartida(uuid, text)
  from public, anon, authenticated;
grant execute on function public.salir_de_agenda_compartida(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
