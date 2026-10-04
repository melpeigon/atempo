-- Permite elegir un aviso el día anterior a la actividad.
-- Las actividades existentes conservan su configuración actual.

alter table public.actividades
drop constraint if exists actividades_tipo_aviso_check;

alter table public.actividades
add constraint actividades_tipo_aviso_check
check (
  tipo_aviso in (
    'sin-aviso',
    'una-hora-antes',
    'un-dia-antes',
    'hora-concreta'
  )
);
