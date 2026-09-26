# Pendientes de Atempo

Última revisión: 27 de septiembre de 2026.

Este archivo es una hoja de ruta. Las tareas están ordenadas para terminar primero el funcionamiento principal de la aplicación y dejar las mejoras más grandes para después.

## Siguiente paso

- [x] Crear las tarjetas de las actividades de hoy.
- [x] Ordenar las actividades de hoy por hora.
- [x] Mostrar en cada tarjeta la hora, la actividad, el icono, la persona, su color y el recordatorio.
- [x] Aplicar los estilos iniciales a las tarjetas siguiendo el boceto.
- [x] Abrir una ficha o detalle al pulsar una actividad.

## Formulario de actividades

- [x] Abrir y cerrar el formulario emergente.
- [x] Cargar automáticamente las personas en el selector.
- [x] Limitar la fecha para que no permita fechas anteriores a hoy.
- [x] Mostrar los días solamente cuando la recurrencia es semanal.
- [x] Marcar automáticamente el día correspondiente a la fecha de inicio.
- [x] Validar que una actividad semanal tenga al menos un día seleccionado.
- [x] Guardar las actividades en `localStorage`.
- [x] Sustituir los avisos `alert()` del navegador por un mensaje de advertencia dentro del formulario.
- [x] Dar estilo al mensaje de advertencia y hacerlo accesible para lectores de pantalla.
- [x] Mostrar las actividades mensuales de los días 29, 30 o 31 el último día de los meses más cortos.
- [x] Avisar de esta regla al elegir una recurrencia mensual que comienza los días 29, 30 o 31.
- [x] Añadir la recurrencia anual para cumpleaños y otros acontecimientos anuales.
- [ ] Mostrar un mensaje claro si se intenta añadir una actividad sin haber creado ninguna persona.

## Gestión de actividades

- [x] Abrir una ficha o detalle al pulsar una actividad.
- [x] Editar una actividad existente.
- [x] Eliminar una actividad existente.
- [ ] Sustituir la confirmación nativa `confirm()` por una confirmación diseñada dentro de la aplicación.
- [x] Eliminar también las actividades asociadas cuando se elimina una persona.

## Calendario

- [ ] Crear la pantalla de calendario.
- [ ] Conectar el botón «Ver calendario».
- [ ] Mostrar actividades puntuales y recurrentes en sus fechas correspondientes.
- [ ] Permitir navegar entre días o meses.

## Personas

- [x] Crear personas.
- [x] Mostrar personas en Inicio.
- [x] Abrir la ficha de una persona.
- [x] Editar personas.
- [x] Eliminar personas.
- [ ] Mostrar en la ficha de cada persona sus próximas actividades.
- [ ] Valorar una confirmación personalizada antes de eliminar una persona.

## Diseño adaptable y móvil

- [ ] Probar la aplicación en un móvil real.
- [ ] Comprobar el tamaño y la separación de todos los botones en móvil.
- [ ] Revisar los estados `hover`, `active` y `focus` de los botones. En pantallas táctiles el estado importante es principalmente `active`.
- [ ] Comprobar que los botones tengan una zona pulsable cómoda, de aproximadamente 44 píxeles como mínimo.
- [ ] Revisar que los formularios emergentes puedan desplazarse en pantallas de poca altura.
- [ ] Comprobar los selectores nativos de persona, actividad, fecha y hora en Android y iPhone antes de personalizarlos.
- [ ] Verificar que no aparezca desplazamiento horizontal.

## Accesibilidad

- [ ] Revisar el contraste de textos, fondos y botones.
- [ ] Comprobar que toda la aplicación pueda utilizarse con teclado.
- [ ] Revisar los textos alternativos y nombres accesibles.
- [ ] Devolver el foco al botón que abrió un formulario cuando este se cierre.
- [ ] Comprobar que los mensajes de error se anuncien correctamente.

## Ayuda y guía de uso

- [ ] Añadir un botón visible para abrir las instrucciones o guía de la aplicación.
- [ ] Explicar en la guía que cada persona tiene asignado un color y que ese color identifica también sus actividades.
- [ ] Explicar brevemente cómo crear personas, añadir actividades, elegir la recurrencia y consultar la agenda.
- [ ] Explicar que las recurrencias mensuales de los días 29, 30 o 31 pasan al último día de los meses más cortos.
- [ ] Explicar la recurrencia anual y el caso especial del 29 de febrero.
- [ ] Decidir si la guía se mostrará como una pantalla propia o como una ventana emergente.

## Datos y publicación

- [x] Guardar personas y actividades localmente con `localStorage` durante el desarrollo.
- [ ] Decidir si la aplicación necesitará usuarios y sincronización entre dispositivos.
- [ ] Si necesita sincronización, configurar una base de datos y autenticación, por ejemplo con Supabase.
- [ ] Preparar los datos existentes para poder migrarlos desde `localStorage`.
- [ ] Publicar una primera versión de prueba.
- [ ] Probar instalación como aplicación web en el móvil si se convierte en PWA.

## Revisión final

- [ ] Probar crear, editar y eliminar varias personas.
- [ ] Probar actividades puntuales, semanales, mensuales y anuales.
- [ ] Probar varias actividades iguales en días y horas diferentes.
- [ ] Probar la aplicación sin datos guardados y con muchos datos guardados.
- [ ] Revisar errores de la consola.
- [ ] Guardar una versión estable en Git.

## Versión 1.1

- [ ] Diferenciar visualmente las actividades cuya hora ya ha pasado.
- [ ] Valorar un estado manual para marcar una actividad como completada.
