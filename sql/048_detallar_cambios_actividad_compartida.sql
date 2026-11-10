-- Guarda los campos que han cambiado en cada modificación de un plan compartido.
-- La cola sigue siendo inaccesible para anon y authenticated.

begin;

alter table public.notificaciones_cambios_actividad
  add column if not exists detalles_cambio jsonb not null default '{}'::jsonb;

create or replace function public.registrar_cambio_actividad_compartida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actividad public.actividades%rowtype;
  persona public.personas%rowtype;
  destinatario_id uuid;
  actor_id uuid := (select auth.uid());
  tipo_evento text;
  detalles_cambio jsonb := '{}'::jsonb;
  nombre_persona_anterior text;
  nombre_persona_nueva text;
begin
  if tg_op = 'UPDATE' then
    -- Ignora actualizaciones que solo cambian updated_at.
    if (pg_catalog.to_jsonb(new) - 'updated_at')
       is not distinct from
       (pg_catalog.to_jsonb(old) - 'updated_at') then
      return new;
    end if;

    if old.visibilidad = 'compartida'
       and new.visibilidad is distinct from 'compartida' then
      actividad := old;
      tipo_evento := 'eliminada';
    elsif new.visibilidad = 'compartida' then
      actividad := new;

      if old.visibilidad is distinct from 'compartida' then
        tipo_evento := 'añadida';
      else
        tipo_evento := 'modificada';
      end if;
    else
      return new;
    end if;

    if tipo_evento = 'modificada' then
      if old.tipo_actividad is distinct from new.tipo_actividad
         or old.nombre_personalizado is distinct from new.nombre_personalizado then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'actividad', pg_catalog.jsonb_build_object(
            'antes', pg_catalog.jsonb_build_object(
              'tipo_actividad', old.tipo_actividad,
              'nombre_personalizado', old.nombre_personalizado
            ),
            'despues', pg_catalog.jsonb_build_object(
              'tipo_actividad', new.tipo_actividad,
              'nombre_personalizado', new.nombre_personalizado
            )
          )
        );
      end if;

      if old.persona_id is distinct from new.persona_id then
        select p.nombre into nombre_persona_anterior
          from public.personas as p
         where p.id = old.persona_id;

        select p.nombre into nombre_persona_nueva
          from public.personas as p
         where p.id = new.persona_id;

        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'persona', pg_catalog.jsonb_build_object(
            'antes', nombre_persona_anterior,
            'despues', nombre_persona_nueva
          )
        );
      end if;

      if old.fecha_inicio is distinct from new.fecha_inicio then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'fecha', pg_catalog.jsonb_build_object(
            'antes', old.fecha_inicio,
            'despues', new.fecha_inicio
          )
        );
      end if;

      if old.hora is distinct from new.hora then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'hora', pg_catalog.jsonb_build_object(
            'antes', old.hora,
            'despues', new.hora
          )
        );
      end if;

      if old.hora_fin is distinct from new.hora_fin then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'hora_fin', pg_catalog.jsonb_build_object(
            'antes', old.hora_fin,
            'despues', new.hora_fin
          )
        );
      end if;

      if old.recurrencia is distinct from new.recurrencia
         or old.dias is distinct from new.dias then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'frecuencia', pg_catalog.jsonb_build_object(
            'antes', pg_catalog.jsonb_build_object(
              'recurrencia', old.recurrencia,
              'dias', old.dias
            ),
            'despues', pg_catalog.jsonb_build_object(
              'recurrencia', new.recurrencia,
              'dias', new.dias
            )
          )
        );
      end if;

      if old.tipo_aviso is distinct from new.tipo_aviso
         or old.hora_aviso is distinct from new.hora_aviso then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'aviso', pg_catalog.jsonb_build_object(
            'antes', pg_catalog.jsonb_build_object(
              'tipo_aviso', old.tipo_aviso,
              'hora_aviso', old.hora_aviso
            ),
            'despues', pg_catalog.jsonb_build_object(
              'tipo_aviso', new.tipo_aviso,
              'hora_aviso', new.hora_aviso
            )
          )
        );
      end if;

      if old.incluir_resumen is distinct from new.incluir_resumen then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'incluir_resumen', pg_catalog.jsonb_build_object(
            'antes', old.incluir_resumen,
            'despues', new.incluir_resumen
          )
        );
      end if;

      if old.recordatorio is distinct from new.recordatorio then
        detalles_cambio := detalles_cambio || pg_catalog.jsonb_build_object(
          'recordatorio', pg_catalog.jsonb_build_object(
            'antes', old.recordatorio,
            'despues', new.recordatorio
          )
        );
      end if;
    end if;

  elsif tg_op = 'DELETE' then
    if old.visibilidad is distinct from 'compartida' then
      return old;
    end if;

    actividad := old;
    tipo_evento := 'eliminada';
  else
    return null;
  end if;

  -- No generar avisos para cambios hechos sin una sesión de usuario.
  if actor_id is null then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  select p.*
    into persona
    from public.personas as p
   where p.id = actividad.persona_id;

  if not found then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  -- Solo se crea una fila para otro miembro que ya pueda ver ese perfil.
  for destinatario_id in
    select distinct miembro.usuario_id
      from public.miembros_familia as miembro
     where miembro.familia_id = persona.familia_id
       and miembro.usuario_id <> actor_id
       and (
         persona.usuario_id = miembro.usuario_id
         or exists (
           select 1
             from public.permisos_personas_miembro as permiso
            where permiso.familia_id = persona.familia_id
              and permiso.persona_id = persona.id
              and permiso.usuario_id = miembro.usuario_id
         )
         or (
           miembro.rol = 'propietaria'
           and (
             persona.tipo_persona = 'menor'
             or persona.usuario_id is null
           )
         )
       )
  loop
    insert into public.notificaciones_cambios_actividad (
      familia_id,
      actividad_id,
      destinatario_id,
      actor_id,
      tipo_evento,
      nombre_persona,
      tipo_actividad,
      nombre_personalizado,
      fecha_inicio,
      hora,
      detalles_cambio
    )
    values (
      persona.familia_id,
      actividad.id,
      destinatario_id,
      actor_id,
      tipo_evento,
      persona.nombre,
      actividad.tipo_actividad,
      actividad.nombre_personalizado,
      actividad.fecha_inicio,
      actividad.hora,
      detalles_cambio
    );
  end loop;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

revoke all on function public.registrar_cambio_actividad_compartida()
  from public, anon, authenticated;

commit;
