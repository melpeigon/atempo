alter table public.actividades
add column hora_fin time;

alter table public.actividades
add constraint actividades_hora_fin_posterior_a_inicio
check (hora_fin is null or hora_fin > hora);
