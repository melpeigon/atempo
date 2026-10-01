alter table public.personas
drop constraint if exists personas_icono_check;

alter table public.personas
add constraint personas_icono_check
check (
  icono in (
    'mujer',
    'hombre',
    'nino',
    'nina',
    'bebe',
    'beba',
    'abuelo',
    'abuela'
  )
);