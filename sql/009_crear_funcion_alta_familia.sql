create or replace function public.crear_familia(
  nombre_familia text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva_familia_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Es necesario iniciar sesión';
  end if;

  if char_length(trim(nombre_familia)) not between 1 and 50 then
    raise exception 'El nombre debe tener entre 1 y 50 caracteres';
  end if;

  insert into public.familias (nombre)
  values (trim(nombre_familia))
  returning id into nueva_familia_id;

  insert into public.miembros_familia (
    familia_id,
    usuario_id,
    rol
  )
  values (
    nueva_familia_id,
    auth.uid(),
    'propietaria'
  );

  insert into public.configuracion_notificaciones (
    usuario_id
  )
  values (
    auth.uid()
  )
  on conflict (usuario_id) do nothing;

  return nueva_familia_id;
end;
$$;

revoke all
on function public.crear_familia(text)
from public;

grant execute
on function public.crear_familia(text)
to authenticated;