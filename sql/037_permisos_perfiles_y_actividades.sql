-- Acceso por perfil para cada miembro y privacidad por actividad.
-- Requiere las migraciones 032-036. No borra agendas, personas ni actividades.

begin;

-- Claves compuestas para asegurar que un permiso nunca mezcle familias.
create unique index if not exists personas_id_familia_unico_idx
  on public.personas (id, familia_id);

create unique index if not exists invitaciones_familia_id_familia_unico_idx
  on public.invitaciones_familia (id, familia_id);

create table if not exists public.invitaciones_familia_perfiles (
  invitacion_id uuid not null,
  familia_id uuid not null,
  persona_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (invitacion_id, persona_id),
  foreign key (invitacion_id, familia_id)
    references public.invitaciones_familia (id, familia_id)
    on delete cascade,
  foreign key (persona_id, familia_id)
    references public.personas (id, familia_id)
    on delete cascade
);

create table if not exists public.permisos_personas_miembro (
  familia_id uuid not null,
  persona_id uuid not null,
  usuario_id uuid not null,
  concedido_por uuid not null references auth.users(id) on delete cascade,
  invitacion_id uuid references public.invitaciones_familia(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (familia_id, persona_id, usuario_id),
  foreign key (persona_id, familia_id)
    references public.personas (id, familia_id)
    on delete cascade,
  foreign key (familia_id, usuario_id)
    references public.miembros_familia (familia_id, usuario_id)
    on delete cascade
);

create index if not exists permisos_personas_miembro_usuario_idx
  on public.permisos_personas_miembro (familia_id, usuario_id);

-- Mantiene para los miembros actuales el acceso previo a los perfiles
-- infantiles. La propietaria podrá ajustar estos permisos desde la interfaz;
-- los adultos personales no se comparten automáticamente.
insert into public.permisos_personas_miembro (
  familia_id, persona_id, usuario_id, concedido_por
)
select persona.familia_id, persona.id, miembro.usuario_id, propietaria.usuario_id
from public.personas as persona
join public.miembros_familia as miembro
  on miembro.familia_id = persona.familia_id
cross join lateral (
  select titular.usuario_id
  from public.miembros_familia as titular
  where titular.familia_id = persona.familia_id
    and titular.rol = 'propietaria'
  limit 1
) as propietaria
where persona.tipo_persona = 'menor'
on conflict (familia_id, persona_id, usuario_id) do nothing;

alter table public.invitaciones_familia_perfiles enable row level security;
alter table public.permisos_personas_miembro enable row level security;
revoke all on public.invitaciones_familia_perfiles from anon, authenticated;
revoke all on public.permisos_personas_miembro from anon, authenticated;

-- Al crear un plan, compartirlo por defecto solo si otra cuenta ya puede ver
-- ese perfil. En caso contrario queda privado hasta elegir explícitamente
-- compartir el perfil o la actividad.
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
    new.creada_por := old.creada_por;
  end if;

  return new;
end;
$$;

revoke all on function public.preparar_autoria_actividad() from public, anon;
grant execute on function public.preparar_autoria_actividad() to authenticated;

create or replace function public.puede_ver_persona(persona_consultada uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and (
        persona.usuario_id = (select auth.uid())
        or exists (
          select 1
          from public.permisos_personas_miembro as permiso
          where permiso.familia_id = persona.familia_id
            and permiso.persona_id = persona.id
            and permiso.usuario_id = (select auth.uid())
        )
        or (
          miembro.rol = 'propietaria'
          and (
            persona.tipo_persona = 'menor'
            or persona.usuario_id is null
          )
        )
      )
  );
$$;

create or replace function public.puede_editar_persona(persona_consultada uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and public.puede_ver_persona(persona.id)
      and (
        persona.tipo_persona = 'menor'
        or persona.usuario_id = (select auth.uid())
        or (persona.usuario_id is null and miembro.rol = 'propietaria')
      )
  );
$$;

create or replace function public.puede_ver_actividad(
  persona_consultada uuid,
  autor_actividad uuid,
  visibilidad_actividad text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and public.puede_ver_persona(persona.id)
      and (
        autor_actividad = (select auth.uid())
        or visibilidad_actividad = 'compartida'
        or (
          autor_actividad is null
          and persona.tipo_persona = 'menor'
        )
        or (
          autor_actividad is null
          and persona.tipo_persona = 'adulto'
          and (
            persona.usuario_id = (select auth.uid())
            or miembro.rol = 'propietaria'
          )
        )
      )
  );
$$;

create or replace function public.puede_editar_actividad(
  persona_consultada uuid,
  autor_actividad uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and public.puede_ver_persona(persona.id)
      and (
        (
          persona.tipo_persona = 'menor'
          and (autor_actividad = (select auth.uid()) or autor_actividad is null)
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (autor_actividad = (select auth.uid()) or autor_actividad is null)
            )
            or (
              persona.usuario_id is null
              and miembro.rol = 'propietaria'
              and (autor_actividad = (select auth.uid()) or autor_actividad is null)
            )
          )
        )
      )
  );
$$;

create or replace function public.puede_guardar_actividad(
  persona_consultada uuid,
  autor_actividad uuid,
  visibilidad_actividad text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas as persona
    join public.miembros_familia as miembro
      on miembro.familia_id = persona.familia_id
    where persona.id = persona_consultada
      and miembro.usuario_id = (select auth.uid())
      and public.puede_ver_persona(persona.id)
      and (
        (
          persona.tipo_persona = 'menor'
          and (autor_actividad = (select auth.uid()) or autor_actividad is null)
          and (
            visibilidad_actividad in ('privada', 'compartida')
            or autor_actividad is null
          )
        )
        or (
          persona.tipo_persona = 'adulto'
          and (
            (
              persona.usuario_id = (select auth.uid())
              and (
                (autor_actividad = (select auth.uid())
                  and visibilidad_actividad in ('privada', 'compartida'))
                or (autor_actividad is null and visibilidad_actividad is null)
              )
            )
            or (
              persona.usuario_id is null
              and miembro.rol = 'propietaria'
              and (
                (autor_actividad = (select auth.uid())
                  and visibilidad_actividad in ('privada', 'compartida'))
                or (autor_actividad is null and visibilidad_actividad is null)
              )
            )
          )
        )
      )
  );
$$;

-- La interfaz usa esta lista para mostrar la casilla de compartir únicamente
-- cuando el perfil está autorizado para al menos otro miembro.
create or replace function public.obtener_perfiles_compartibles()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select persona.id
  from public.personas as persona
  where public.puede_ver_persona(persona.id)
    and (
      persona.tipo_persona = 'menor'
      or persona.usuario_id = (select auth.uid())
      or (
        persona.usuario_id is null
        and exists (
          select 1 from public.miembros_familia as actual
          where actual.familia_id = persona.familia_id
            and actual.usuario_id = (select auth.uid())
            and actual.rol = 'propietaria'
        )
      )
    )
    and exists (
      select 1
      from public.miembros_familia as otro_miembro
      where otro_miembro.familia_id = persona.familia_id
        and otro_miembro.usuario_id <> (select auth.uid())
        and (
          exists (
            select 1
            from public.permisos_personas_miembro as permiso
            where permiso.familia_id = persona.familia_id
              and permiso.persona_id = persona.id
              and permiso.usuario_id = otro_miembro.usuario_id
          )
          or (
            otro_miembro.rol = 'propietaria'
            and (persona.tipo_persona = 'menor' or persona.usuario_id is null)
          )
        )
    );
$$;

create or replace function public.configurar_perfiles_compartidos(
  familia_consultada uuid,
  usuario_destino uuid,
  perfiles_compartidos uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  perfiles_normalizados uuid[];
  rol_actual text;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para cambiar los permisos';
  end if;

  select miembro.rol into rol_actual
  from public.miembros_familia as miembro
  where miembro.familia_id = familia_consultada
    and miembro.usuario_id = (select auth.uid());

  if rol_actual is null then
    raise exception 'No perteneces a esta agenda';
  end if;

  if not exists (
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = usuario_destino
  ) then
    raise exception 'La cuenta elegida ya no pertenece a esta agenda';
  end if;

  if usuario_destino = (select auth.uid()) then
    raise exception 'No puedes cambiar tus propios permisos desde aquí';
  end if;

  select coalesce(array_agg(seleccion.id), '{}'::uuid[])
    into perfiles_normalizados
    from (
      select distinct id
      from unnest(coalesce(perfiles_compartidos, '{}'::uuid[])) as lista(id)
      order by id
    ) as seleccion;

  if exists (
    select 1
    from unnest(perfiles_normalizados) as seleccion(id)
    left join public.personas as persona
      on persona.id = seleccion.id
     and persona.familia_id = familia_consultada
    where persona.id is null
       or (
         persona.tipo_persona = 'menor'
         and rol_actual <> 'propietaria'
       )
       or (
         persona.tipo_persona = 'adulto'
         and not (
           persona.usuario_id = (select auth.uid())
           or (persona.usuario_id is null and rol_actual = 'propietaria')
         )
       )
  ) then
    raise exception 'No tienes permiso para compartir uno de esos perfiles';
  end if;

  delete from public.permisos_personas_miembro as permiso
  where permiso.familia_id = familia_consultada
    and permiso.usuario_id = usuario_destino;

  insert into public.permisos_personas_miembro (
    familia_id, persona_id, usuario_id, concedido_por
  )
  select familia_consultada, seleccion.id, usuario_destino, (select auth.uid())
  from unnest(perfiles_normalizados) as seleccion(id);

  return true;
end;
$$;

create or replace function public.obtener_miembros_compartidos(
  familia_consultada uuid
)
returns table (usuario_id uuid, email text, rol text)
language sql
stable
security definer
set search_path = ''
as $$
  select miembro.usuario_id, usuario.email::text, miembro.rol
  from public.miembros_familia as miembro
  join auth.users as usuario on usuario.id = miembro.usuario_id
  where miembro.familia_id = familia_consultada
    and miembro.usuario_id <> (select auth.uid())
    and exists (
      select 1 from public.miembros_familia as solicitante
      where solicitante.familia_id = familia_consultada
        and solicitante.usuario_id = (select auth.uid())
        and solicitante.rol = 'propietaria'
    );
$$;

create or replace function public.obtener_perfiles_compartidos_miembro(
  familia_consultada uuid,
  usuario_consultado uuid
)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select permiso.persona_id
  from public.permisos_personas_miembro as permiso
  where permiso.familia_id = familia_consultada
    and permiso.usuario_id = usuario_consultado
    and exists (
      select 1 from public.miembros_familia as solicitante
      where solicitante.familia_id = familia_consultada
        and solicitante.usuario_id = (select auth.uid())
        and solicitante.rol = 'propietaria'
    )
  order by permiso.persona_id;
$$;

-- La invitación guarda el consentimiento de la propietaria perfil por perfil.
drop function if exists public.crear_invitacion_familia(uuid, text);
create function public.crear_invitacion_familia(
  familia_consultada uuid,
  correo_invitado text,
  perfiles_compartidos uuid[]
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
  invitacion_nueva uuid;
  perfiles_normalizados uuid[];
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
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = familia_consultada
      and miembro.usuario_id = (select auth.uid())
      and miembro.rol = 'propietaria'
  ) then
    raise exception 'Solo una persona propietaria puede invitar a esta agenda';
  end if;

  if exists (
    select 1
    from auth.users as usuario
    join public.miembros_familia as miembro on miembro.usuario_id = usuario.id
    where miembro.familia_id = familia_consultada
      and lower(usuario.email) = correo_normalizado
  ) then
    raise exception 'Esa cuenta ya pertenece a esta agenda';
  end if;

  select coalesce(array_agg(seleccion.id), '{}'::uuid[])
    into perfiles_normalizados
    from (
      select distinct id
      from unnest(coalesce(perfiles_compartidos, '{}'::uuid[])) as lista(id)
      order by id
    ) as seleccion;

  if cardinality(perfiles_normalizados) = 0 then
    raise exception 'Selecciona al menos un perfil para compartir';
  end if;

  if exists (
    select 1
    from unnest(perfiles_normalizados) as seleccion(id)
    left join public.personas as persona
      on persona.id = seleccion.id
     and persona.familia_id = familia_consultada
    where persona.id is null
       or (
         persona.tipo_persona = 'adulto'
         and persona.usuario_id is not null
         and persona.usuario_id <> (select auth.uid())
       )
  ) then
    raise exception 'No tienes permiso para compartir uno de esos perfiles';
  end if;

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
    familia_id, email_invitado, token_hash, creada_por, expires_at
  )
  values (
    familia_consultada,
    correo_normalizado,
    encode(extensions.digest(convert_to(token_nuevo, 'UTF8'), 'sha256'), 'hex'),
    (select auth.uid()),
    caduca_en
  )
  returning id into invitacion_nueva;

  insert into public.invitaciones_familia_perfiles (
    invitacion_id, familia_id, persona_id
  )
  select invitacion_nueva, familia_consultada, seleccion.id
  from unnest(perfiles_normalizados) as seleccion(id);

  return jsonb_build_object(
    'token', token_nuevo,
    'email', correo_normalizado,
    'expires_at', caduca_en
  );
end;
$$;

-- Compatibilidad temporal con la versión publicada: si aún carga el
-- formulario antiguo, solo comparte perfiles de menores por defecto.
create function public.crear_invitacion_familia(
  familia_consultada uuid,
  correo_invitado text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  perfiles_menores uuid[];
begin
  select coalesce(array_agg(persona.id), '{}'::uuid[])
    into perfiles_menores
    from public.personas as persona
  where persona.familia_id = familia_consultada
    and persona.tipo_persona = 'menor';

  return public.crear_invitacion_familia(
    familia_consultada, correo_invitado, perfiles_menores
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

  select lower(usuario.email) into correo_actual
  from auth.users as usuario
  where usuario.id = usuario_actual
    and usuario.email_confirmed_at is not null;

  if correo_actual is null then
    raise exception 'Confirma tu correo e inicia sesión antes de aceptar';
  end if;

  if token_invitacion is null or token_invitacion !~ '^[a-f0-9]{64}$' then
    raise exception 'El enlace de invitación no es válido';
  end if;

  select * into invitacion
  from public.invitaciones_familia as registro
  where registro.token_hash = encode(
    extensions.digest(convert_to(token_invitacion, 'UTF8'), 'sha256'), 'hex'
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
    select 1 from public.miembros_familia as miembro
    where miembro.familia_id = invitacion.familia_id
      and miembro.usuario_id = usuario_actual
  ) then
    raise exception 'Ya perteneces a esta agenda';
  end if;

  insert into public.miembros_familia (familia_id, usuario_id, rol)
  values (invitacion.familia_id, usuario_actual, 'miembro');

  insert into public.personas (
    familia_id, nombre, color, icono, tipo_persona, usuario_id
  )
  values (
    invitacion.familia_id, trim(nombre_adulto), trim(color_adulto),
    icono_adulto, 'adulto', usuario_actual
  );

  insert into public.permisos_personas_miembro (
    familia_id, persona_id, usuario_id, concedido_por, invitacion_id
  )
  select invitacion.familia_id, perfil.persona_id, usuario_actual,
         invitacion.creada_por, invitacion.id
  from public.invitaciones_familia_perfiles as perfil
  where perfil.invitacion_id = invitacion.id
    and perfil.familia_id = invitacion.familia_id;

  update public.invitaciones_familia
  set accepted_at = now(), accepted_by = usuario_actual
  where id = invitacion.id;

  familia_aceptada := invitacion.familia_id;
  return familia_aceptada;
end;
$$;

drop policy if exists "Miembros pueden ver personas de su agenda" on public.personas;
drop policy if exists "Miembros pueden crear personas de su agenda" on public.personas;
drop policy if exists "Miembros pueden editar personas permitidas" on public.personas;
drop policy if exists "Miembros pueden borrar personas permitidas" on public.personas;

create policy "Miembros ven perfiles propios o compartidos"
on public.personas for select to authenticated
using (public.puede_ver_persona(id));

create policy "Miembros crean perfiles de su agenda"
on public.personas for insert to authenticated
with check (
  public.es_miembro_familia(familia_id)
  and (
    (tipo_persona = 'menor' and usuario_id is null)
    or (tipo_persona = 'adulto' and (usuario_id is null or usuario_id = (select auth.uid())))
  )
);

create policy "Miembros editan perfiles permitidos"
on public.personas for update to authenticated
using (public.puede_editar_persona(id))
with check (
  public.es_miembro_familia(familia_id)
  and (
    (tipo_persona = 'menor' and usuario_id is null)
    or (tipo_persona = 'adulto' and (usuario_id is null or usuario_id = (select auth.uid())))
  )
);

create policy "Miembros eliminan perfiles permitidos"
on public.personas for delete to authenticated
using (public.puede_editar_persona(id));

drop policy if exists "Miembros pueden consultar actividades permitidas" on public.actividades;
drop policy if exists "Miembros pueden crear actividades permitidas" on public.actividades;
drop policy if exists "Autores pueden editar actividades permitidas" on public.actividades;
drop policy if exists "Usuarios pueden borrar actividades permitidas" on public.actividades;

create policy "Miembros consultan actividades de perfiles permitidos"
on public.actividades for select to authenticated
using (public.puede_ver_actividad(persona_id, creada_por, visibilidad));

create policy "Miembros crean actividades de perfiles permitidos"
on public.actividades for insert to authenticated
with check (
  creada_por = (select auth.uid())
  and public.puede_guardar_actividad(persona_id, creada_por, visibilidad)
);

create policy "Autores editan actividades permitidas"
on public.actividades for update to authenticated
using (public.puede_editar_actividad(persona_id, creada_por))
with check (public.puede_guardar_actividad(persona_id, creada_por, visibilidad));

create policy "Usuarios borran actividades permitidas"
on public.actividades for delete to authenticated
using (public.puede_editar_actividad(persona_id, creada_por));

revoke all on function public.puede_ver_persona(uuid) from public, anon, authenticated;
revoke all on function public.puede_editar_persona(uuid) from public, anon, authenticated;
revoke all on function public.puede_ver_actividad(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.puede_editar_actividad(uuid, uuid) from public, anon, authenticated;
revoke all on function public.puede_guardar_actividad(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.obtener_perfiles_compartibles() from public, anon, authenticated;
revoke all on function public.configurar_perfiles_compartidos(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.obtener_miembros_compartidos(uuid) from public, anon, authenticated;
revoke all on function public.obtener_perfiles_compartidos_miembro(uuid, uuid) from public, anon, authenticated;
revoke all on function public.crear_invitacion_familia(uuid, text, uuid[]) from public, anon, authenticated;
revoke all on function public.crear_invitacion_familia(uuid, text) from public, anon, authenticated;
revoke all on function public.aceptar_invitacion_familia(text, text, text, text) from public, anon, authenticated;

grant execute on function public.puede_ver_persona(uuid) to authenticated;
grant execute on function public.puede_editar_persona(uuid) to authenticated;
grant execute on function public.puede_ver_actividad(uuid, uuid, text) to authenticated;
grant execute on function public.puede_editar_actividad(uuid, uuid) to authenticated;
grant execute on function public.puede_guardar_actividad(uuid, uuid, text) to authenticated;
grant execute on function public.obtener_perfiles_compartibles() to authenticated;
grant execute on function public.configurar_perfiles_compartidos(uuid, uuid, uuid[]) to authenticated;
grant execute on function public.obtener_miembros_compartidos(uuid) to authenticated;
grant execute on function public.obtener_perfiles_compartidos_miembro(uuid, uuid) to authenticated;
grant execute on function public.crear_invitacion_familia(uuid, text, uuid[]) to authenticated;
grant execute on function public.crear_invitacion_familia(uuid, text) to authenticated;
grant execute on function public.aceptar_invitacion_familia(text, text, text, text) to authenticated;

commit;
