-- El procesador debe leer los permisos de perfiles compartidos para filtrar
-- correctamente los avisos, y registrar sus propios errores técnicos.
-- RLS sigue activa; estos permisos se conceden únicamente al rol de servidor.

grant select
on table public.permisos_personas_miembro
to service_role;

grant insert
on table public.errores_app
to service_role;
