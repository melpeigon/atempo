create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger actualizar_personas_updated_at
before update on public.personas
for each row
execute function public.actualizar_updated_at();

create trigger actualizar_actividades_updated_at
before update on public.actividades
for each row
execute function public.actualizar_updated_at();

create trigger actualizar_configuracion_updated_at
before update on public.configuracion_notificaciones
for each row
execute function public.actualizar_updated_at();

create trigger actualizar_dispositivos_updated_at
before update on public.dispositivos_notificaciones
for each row
execute function public.actualizar_updated_at();