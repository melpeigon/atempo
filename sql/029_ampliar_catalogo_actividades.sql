-- Amplía las opciones de actividad sin borrar los tipos que ya están guardados.
-- «ingles» se mantiene temporalmente por compatibilidad con datos antiguos.

alter table public.actividades
  drop constraint if exists actividades_tipo_actividad_check;

alter table public.actividades
  add constraint actividades_tipo_actividad_check
  check (
    tipo_actividad in (
      'musica',
      'catequesis',
      'futbol',
      'cumple',
      'peluqueria',
      'dentista',
      'ingles',
      'padel',
      'gym',
      'medico',
      'personalizada',
      'baloncesto',
      'natacion',
      'running',
      'pilates-yoga',
      'idiomas',
      'baile',
      'teatro',
      'dibujo',
      'apoyo-escolar',
      'vacuna',
      'terapia',
      'reunion',
      'excursion',
      'festival',
      'entrega-trabajo',
      'examen',
      'celebracion',
      'estetica'
    )
  );
