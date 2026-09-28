# Pendientes de Atempo

Última revisión: 28 de septiembre de 2026.

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
- [x] Impedir guardar actividades si todavía no existe ninguna persona mediante el selector obligatorio vacío.
- [ ] Valorar más adelante un mensaje propio que explique que primero hay que añadir una persona.

## Gestión de actividades

- [x] Abrir una ficha o detalle al pulsar una actividad.
- [x] Editar una actividad existente.
- [x] Eliminar una actividad existente.
- [x] Sustituir la confirmación nativa `confirm()` por una confirmación diseñada dentro de la aplicación.
- [x] Eliminar también las actividades asociadas cuando se elimina una persona.

## Calendario

- [x] Crear `js/calendario.js` y `css/calendario.css` para mantener esta pantalla separada.
- [x] Crear la estructura de la pantalla de calendario.
- [x] Conectar el botón «Ver calendario» y el botón «Volver».
- [x] Mostrar actividades puntuales y recurrentes en sus fechas correspondientes.
- [x] Permitir navegar entre meses.
- [x] Limitar los iconos visibles por día y mostrar un indicador cuando existan más actividades.
- [x] Mostrar la lista completa de un día desde su indicador y abrir sus fichas.

## Personas

- [x] Crear personas.
- [x] Mostrar personas en Inicio.
- [x] Abrir la ficha de una persona.
- [x] Editar personas.
- [x] Eliminar personas.
- [x] Mostrar en la ficha de cada persona sus próximas actividades.

## Diseño adaptable y móvil

- [x] Probar la aplicación instalada en un móvil real.
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

- [ ] Revisar todos los textos de la aplicación para que sean divertidos, cariñosos, claros y cercanos.
- [ ] Mantener una voz coherente en mensajes vacíos, ayudas, errores, confirmaciones y notificaciones.
- [x] Añadir un botón visible para abrir las instrucciones o guía de la aplicación.
- [x] Explicar en la guía que cada persona tiene asignado un color y que ese color identifica también sus actividades.
- [x] Explicar brevemente cómo crear personas, añadir actividades, elegir la recurrencia y consultar la agenda.
- [x] Explicar que las recurrencias mensuales de los días 29, 30 o 31 pasan al último día de los meses más cortos.
- [x] Explicar la recurrencia anual y el caso especial del 29 de febrero.
- [x] Mostrar la guía como una pantalla propia y desplazable.

## Notificaciones — imprescindibles para la versión 1.0

- [x] Añadir al formulario de actividad un selector «Avisarme»: sin aviso, 1 hora antes o a una hora concreta.
- [x] Mostrar un campo de hora solamente cuando se elija «A una hora concreta».
- [ ] Decidir si una actividad puede tener uno o varios avisos.
- [x] Añadir al formulario de actividad la elección de cuándo recibir la notificación.
- [x] Guardar la configuración del aviso junto con los demás datos de la actividad.
- [x] Mostrar en la ficha de actividad cuándo se recibirá la notificación.
- [x] Permitir modificar o desactivar posteriormente el aviso de una actividad.
- [x] Añadir una configuración general e independiente para recibir un resumen con todas las actividades del día.
- [x] Permitir activar o desactivar el resumen diario y elegir su hora mediante un campo de hora.
- [x] Permitir activar o pausar las notificaciones en cada dispositivo mediante una casilla visible.
- [x] Permitir elegir un modo general: solo avisos individuales, solo resumen diario o resumen más avisos individuales.
- [x] Si se elige «Solo resumen diario», conservar los avisos configurados en las actividades para ignorarlos temporalmente al conectar los envíos.
- [x] Crear un menú general desde el que se pueda acceder a «Notificaciones» y «Guía de uso».
- [x] Solicitar permiso para las notificaciones solamente cuando la persona active su casilla.
- [x] Convertir Atempo en una aplicación web instalable (PWA), con manifiesto e iconos.
- [x] Registrar un `service worker` y comprobar que puede mostrar notificaciones en un móvil.
- [ ] Guardar las actividades y las suscripciones a notificaciones en una base de datos.
- [ ] Programar desde el servidor el envío de cada aviso, incluso cuando Atempo esté cerrada.
- [x] Probar las notificaciones con la aplicación instalada en un móvil real.
- [ ] Probar la instalación y las notificaciones en el otro sistema móvil: Android o iPhone.
- [ ] Explicar en la guía cómo instalar Atempo, activar los avisos y modificar sus permisos.

## Datos y publicación

- [x] Guardar personas y actividades localmente con `localStorage` durante el desarrollo.
- [ ] Diseñar los usuarios y la sincronización entre dispositivos necesarios para las notificaciones.
- [ ] Configurar una base de datos y autenticación, por ejemplo con Supabase.
- [ ] Preparar los datos existentes para poder migrarlos desde `localStorage`.
- [x] Publicar una primera versión de prueba en GitHub Pages.
- [x] Probar la instalación como aplicación web en el móvil.

## Revisión final

- [x] Probar crear, editar y eliminar varias personas.
- [ ] Probar actividades puntuales, semanales, mensuales y anuales.
- [x] Probar crear, editar y eliminar actividades.
- [ ] Probar varias actividades iguales en días y horas diferentes.
- [ ] Probar la aplicación sin datos guardados y con muchos datos guardados.
- [ ] Revisar errores de la consola.
- [x] Guardar una versión estable en Git.

## Versión 1.1 — cierre de versión

- [x] Sustituir los iconos de instalación por una versión con solo el símbolo de Atempo, sin el nombre pequeño.
- [x] Permitir incluir o excluir cada actividad del resumen diario.
- [x] Activar o pausar las notificaciones mediante una casilla visible.
- [x] Comprobar las notificaciones con Atempo instalada en un móvil.
- [x] Hacer que una notificación abra o lleve al frente la aplicación.
- [x] Mejorar la actualización automática de la PWA cuando se publica una versión nueva.
- [x] Añadir «Médico» a la lista de actividades utilizando su icono propio.
- [x] Crear el icono `personalizado.svg`: un lápiz con una pequeña chispa, sin fondo.
- [x] Añadir una actividad «Personalizada» que permita escribir su nombre y utilice su icono propio.
- [ ] Diseñar la bienvenida que se muestra al abrir el enlace de Atempo sin instalarla.
- [ ] Mostrar un botón de instalación compatible en Android.
- [ ] Mostrar instrucciones breves para instalar Atempo desde Safari en iPhone.
- [ ] Ocultar la bienvenida cuando Atempo ya esté instalada.
- [ ] Conectar el botón Atrás del móvil con la navegación interna de Atempo.

## Versión 1.2

- [ ] Diferenciar visualmente las actividades cuya hora ya ha pasado.
- [ ] Valorar un estado manual para marcar una actividad como completada.
- [ ] Añadir una pequeña orientación inicial para configurar las notificaciones.
- [ ] Organizar las actividades por categorías.
- [ ] pulsar el numero del calendario y ver todas las actividades como se ven con el boton N

## Ideas para versiones futuras

- [ ] Incorporar cuentas e inicio de sesión para que cada familia pueda acceder a sus datos desde distintos dispositivos.
- [ ] Explorar una función de inteligencia artificial que aporte utilidad real a las familias.
- [ ] Valorar ideas como resumir la semana, detectar conflictos de horarios, sugerir momentos libres o ayudar a redactar recordatorios.
- [ ] Definir primero el problema que resolverá la IA antes de elegir una herramienta o incorporarla a la aplicación.
- [ ] La pantalla breve durante el arranque.
