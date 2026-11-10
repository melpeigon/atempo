# Sistema de notificaciones de Atempo

Última revisión: 10 de noviembre de 2026.

Atempo utiliza notificaciones push para poder avisar aunque la PWA esté
cerrada. El permiso pertenece a cada dispositivo: activar los avisos en un
móvil no los activa automáticamente en otro.

## Opciones disponibles

Una actividad puede configurarse con:

- Sin aviso.
- Una hora antes.
- Un día antes, a la hora de la actividad.
- A una hora concreta.

La configuración general permite recibir:

- Solo avisos de actividades.
- Solo resumen diario.
- Resumen diario y avisos de actividades.

Cada actividad decide además si debe aparecer en el resumen diario.

Cuando un adulto crea una actividad compartida en un perfil que otro miembro
puede ver, el procesador puede enviarle un aviso push de nuevo plan. Esta
notificación de creación ya se ha comprobado en producción. Se envía en la
siguiente ejecución del cron (normalmente en menos de un minuto) y respeta el
modo de notificaciones del destinatario: debe tener activos los avisos de
actividades, además de una suscripción push activa.

Los avisos de modificación y eliminación están desplegados en producción y en
pruebas con testers. La migración
`sql/048_detallar_cambios_actividad_compartida.sql` guarda una comparación de
los valores anteriores y nuevos de una modificación. El aviso puede resumir,
por ejemplo, un cambio de hora o de aviso. La cola de eventos tiene RLS
activado: las cuentas normales no pueden leerla y solo la procesa el servidor.
La ronda de pruebas comprobará estos casos en distintos dispositivos y con
personas que tengan o no acceso al perfil compartido.

## Recorrido de una notificación

```text
La usuaria activa los avisos
        ↓
El navegador crea una suscripción push
        ↓
Atempo guarda el dispositivo en Supabase
        ↓
El cron ejecuta procesar-avisos cada minuto
        ↓
La Edge Function consulta actividades y preferencias
        ↓
Envía el aviso al servicio push del dispositivo
        ↓
El service worker muestra la notificación
```

## Componentes

### En el navegador

- `js/menu.js`: permiso, activación, preferencias y dispositivo.
- `service-worker.js`: recepción, presentación y apertura de la notificación.
- `js/seguimiento.js`: registro de fallos técnicos.

### En Supabase

- `configuracion_notificaciones`: modo y hora del resumen.
- `dispositivos_notificaciones`: suscripciones push activas.
- `avisos_enviados`: evita duplicados.
- `notificaciones_cambios_actividad`: cola interna para cambios y borrados de
  planes compartidos; inaccesible para cuentas normales.
- `errores_app`: fallos de la app y del procesador.
- `procesar-avisos`: Edge Function que decide y envía los avisos.
- Cron `procesar-avisos-cada-minuto`: ejecución automática.

## Seguridad

- La clave pública VAPID puede utilizarse en el navegador.
- La clave privada VAPID y la clave secreta de Supabase solo existen como
  secretos del servidor.
- La Edge Function `procesar-avisos` acepta únicamente autenticación secreta.
- Las políticas RLS impiden que una cuenta gestione dispositivos ajenos.
- No deben copiarse secretos en GitHub, `index.html` ni archivos JavaScript.

## Prevención de duplicados

Antes de enviar, el procesador construye una clave con el tipo de aviso, la
actividad y la fecha. Si esa clave ya existe en `avisos_enviados`, no repite la
notificación.

Editar una actividad después de haber recibido su aviso no elimina ese
historial ni provoca automáticamente un segundo envío para el mismo momento.

## Fallos y dispositivos caducados

Si el servicio push rechaza una suscripción:

1. Se registra un error con origen `procesador-avisos`.
2. El dispositivo se marca como inactivo.
3. El resto de usuarias continúa procesándose.
4. Atempo puede pedir a la usuaria que revise los avisos al volver a abrirla.

Rechazar voluntariamente el permiso, pausar los avisos o utilizar un navegador
sin soporte no se considera un fallo técnico.

## Publicar cambios del procesador

Modificar el archivo local no actualiza Supabase automáticamente. Después de
editar `supabase/functions/procesar-avisos/index.ts` hay que desplegar de nuevo
la Edge Function desde el editor de Supabase o mediante su CLI.

El procesador usa el rol `service_role` para leer los permisos de perfiles
compartidos y guardar sus errores técnicos. La migración
`sql/046_permisos_lectura_avisos_compartidos.sql` concede únicamente la lectura
de `permisos_personas_miembro` y la inserción en `errores_app`; no desactiva RLS.
La migración `sql/048_detallar_cambios_actividad_compartida.sql` amplía la cola
para registrar qué campos se modificaron, manteniéndola cerrada a `anon` y
`authenticated`.

Para una prueba manual:

1. Abrir la función `procesar-avisos`.
2. Usar método `POST` y cuerpo `{}`.
3. Seleccionar la clave secreta del proyecto, nunca la clave publicable.
4. Enviar la petición y comprobar la respuesta y los logs.

Una ejecución correcta puede enviar cero avisos si en ese minuto no corresponde
ninguno.

