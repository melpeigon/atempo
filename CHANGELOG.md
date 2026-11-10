# Historial de cambios de Atempo

Este archivo recoge las novedades principales de cada versión. Las Releases de
GitHub conservan el punto exacto del código publicado; este documento explica
qué cambió entre versiones.

## Candidata 1.5.0-beta.1 — en pruebas

### Añadido

- Avisos push a los otros adultos autorizados cuando se crea, modifica o elimina
  un plan compartido. Las notificaciones de modificación indican qué datos
  cambiaron, como la actividad, fecha, hora, recurrencia o aviso.
- Columna en el panel de administración para ver con qué otras cuentas comparte
  agenda cada tester.

### Mejorado

- El procesador de notificaciones respeta los permisos de perfiles compartidos y
  evita enviar avisos sobre información que la persona destinataria no puede ver.
- Corregida la lectura de permisos necesaria para preparar los resúmenes diarios
  de agendas con perfiles compartidos.

> El procesador ya está desplegado en producción y las testers están comprobando
> los avisos con distintos móviles y situaciones. Esta candidata deja registrado
> el estado de las pruebas; no es todavía el lanzamiento estable 1.5.0.
> La columna de agendas compartidas del panel aún necesita aplicar y probar su
> migración SQL.

## 1.4.0 — 29 de octubre de 2026

### Añadido

- Agendas compartidas entre adultos mediante invitaciones.
- Vista conjunta de los perfiles propios y compartidos, sin fusionar fichas.
- Permisos para elegir qué perfiles y actividades puede consultar cada adulto.
- Opción para autorizar que el otro adulto edite las actividades compartidas
  que haya creado cada persona.
- Salida de una agenda compartida con opción de conservar copias de los perfiles
  y planes visibles en la agenda propia.
- Identificador visual discreto para distinguir perfiles compartidos.

### Mejorado

- La aceptación de una invitación no crea una ficha adulta duplicada ni mueve
  las personas o actividades personales de quien se une.
- La propietaria puede dejar de compartir la agenda y decidir qué hacer con los
  planes compartidos creados por la persona que sale.

## 1.3.0 — 23 de octubre de 2026

### Añadido

- Catálogo de actividades organizado por categorías y con buscador.
- Hora de fin opcional para las actividades, visible en agendas y resúmenes.
- Hora configurable para los avisos del día anterior; por defecto, la hora de inicio.
- Aviso único con las novedades pendientes desde el registro de cada tester.

### Mejorado

- El formulario de actividad presenta las horas de inicio y fin en una sola fila.
- El panel indica si cada tester está al día con las novedades o tiene pendientes.

## 1.2.3 — 22 de octubre de 2026

### Añadido

- Aviso dentro de Atempo con las novedades de cada versión.
- Confirmación «Entendido» guardada una sola vez por cuenta y versión.
- Estado «Informada» o «No informada» en la tabla de testers.
- Formulario seguro para publicar novedades desde el panel de administración.

### Mejorado

- Las comunicaciones de las versiones beta pueden mostrarse dentro de Atempo
  sin depender del correo electrónico ni de las notificaciones push.

## 1.2.2 — 17 de octubre de 2026

### Añadido

- Registro de fallos de configuración, dispositivos y notificaciones.
- Registro de errores producidos por el procesador automático de avisos.
- Distinción entre errores de la aplicación y del servidor.
- Estados «Pendiente» y «Revisado» para gestionar errores desde el panel.
- Documentación inicial del proyecto, panel y sistema de notificaciones.
- Orientación breve para distinguir avisos individuales y resumen diario.
- Selección de cualquier día del calendario, incluso cuando no tiene planes.
- Listado de actividades correspondiente al día seleccionado.
- Creación de actividades desde el calendario con la fecha ya rellenada.
- Mensajes cariñosos para los días sin planes.

### Mejorado

- Un fallo al procesar los avisos de una usuaria ya no interrumpe la revisión
  del resto de cuentas.
- Los dispositivos rechazados por el servicio push se desactivan y dejan un
  registro técnico para soporte.
- El día seleccionado se distingue con claridad del día actual y de los
  colores asignados a cada persona.

## 1.2.1 — 8 de octubre de 2026

### Añadido

- Panel privado de administración.
- Resumen de testers, actividad reciente y versiones pendientes.
- Listado y buscador de testers.
- Última apertura, plataforma, instalación y dispositivos activos.
- Registro inicial de errores al cargar o modificar personas y actividades.
- Recuperación de contraseña.

### Mejorado

- Detección y recuperación de suscripciones push desconectadas.
- Aviso dentro de Atempo cuando un dispositivo necesita revisar sus
  notificaciones.

## 1.2.0 — 1 de octubre de 2026

### Añadido

- Cuentas, familias y almacenamiento de personas y actividades en Supabase.
- Preferencias de notificaciones guardadas por cuenta.
- Procesamiento automático de avisos push y resumen diario desde el servidor.
- Aviso un día antes de una actividad.
- Diferenciación automática de las actividades cuya hora ya ha pasado.
- Nuevos iconos y opciones de persona.
- Acceso a crear actividades desde la ficha de una persona.

### Mejorado

- Agenda diaria, fichas de personas y navegación móvil.
- Fecha mostrada al abrir actividades recurrentes desde el calendario.

## 1.1.0 — 29 de septiembre de 2026

### Añadido

- Primera PWA instalable de Atempo.
- Actividad personalizada y actividad médica.
- Pantalla de bienvenida e instrucciones de instalación.
- Guía de uso y navegación mediante el botón Atrás del móvil.
- Configuración visual de avisos y resumen diario.

