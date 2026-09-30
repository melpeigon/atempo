-- Lecturas necesarias para decidir qué avisos corresponden.
grant select
on table
  public.configuracion_notificaciones,
  public.miembros_familia,
  public.personas,
  public.actividades
to service_role;

-- Lectura y actualización de suscripciones activas o caducadas.
grant select, update
on table public.dispositivos_notificaciones
to service_role;

-- Lectura e inserción del historial que evita avisos duplicados.
grant select, insert
on table public.avisos_enviados
to service_role;
