-- Primer aviso de actualización mostrado dentro de Atempo.

insert into public.novedades_app (
  version,
  titulo,
  cambios
)
values (
  '1.2.2',
  'Atempo tiene cositas nuevas ✨',
  array[
    'Elige cualquier día del calendario para ver todos sus planes.',
    'Añade una actividad desde el calendario con la fecha ya preparada.',
    'Y si el día está tranquilo, tenemos un pequeño mensaje para ti.'
  ]
)
returning *;
