# Panel de administración de Atempo

Última revisión: 17 de octubre de 2026.

El panel es una herramienta privada de soporte durante las pruebas de Atempo.
Se abre desde `admin.html` y no forma parte de la navegación normal de las
usuarias.

## Acceso

Para entrar es necesario:

1. Haber iniciado sesión en Atempo.
2. Tener el identificador de la cuenta en `public.administradores`.

El navegador utiliza la clave pública de Supabase. Las funciones SQL vuelven a
comprobar el rol de administradora antes de devolver o modificar información.
El panel nunca contiene una clave secreta.

## Vista general

Las tarjetas superiores muestran:

- **Testers:** cuentas creadas.
- **Actividad reciente:** cuentas que han abierto Atempo durante los últimos
  siete días.
- **Actualización pendiente:** dispositivos cuya versión registrada no
  coincide con `VERSION_ATEMPO`.

Estos valores describen la última información registrada. No garantizan que el
sistema operativo mantenga actualmente todos los permisos concedidos.

## Listado de testers

La tabla muestra únicamente información necesaria para pruebas y soporte:

- Correo de la cuenta.
- Plataforma conocida.
- Uso como PWA instalada o navegador.
- Versión registrada.
- Última apertura.
- Número de dispositivos activos para notificaciones.
- Estado de actividad.

No muestra personas, actividades, recordatorios ni contenido de las agendas.

## Errores recientes

La aplicación registra fallos reales al cargar o modificar la agenda, preparar
la familia, configurar notificaciones o registrar el service worker. El
procesador del servidor registra fallos de lectura y envío de avisos.

Cada registro puede incluir:

- Contexto de la operación.
- Mensaje y código técnico.
- Fecha.
- Versión y plataforma.
- Cuenta afectada, cuando se conoce.
- Origen: aplicación o procesador de avisos.

No se registran decisiones normales como rechazar el permiso de notificaciones
ni navegadores incompatibles. Tampoco deben guardarse contraseñas o contenido
de las agendas.

Los errores nuevos aparecen como **Pendientes**. Una administradora puede
marcarlos como **Revisados** sin eliminarlos y devolverlos a pendiente si fuera
necesario. Los pendientes se muestran primero.

## Archivos relacionados

- `admin.html`: estructura del panel.
- `css/admin.css`: aspecto visual.
- `js/admin.js`: acceso, carga y acciones del panel.
- `js/seguimiento.js`: registro de errores desde Atempo.
- `sql/014` a `sql/023`: administradoras, métricas, testers y errores.
- `supabase/functions/procesar-avisos/index.ts`: errores del servidor.

## Funciones SQL utilizadas

- `obtener_resumen_admin(version_actual)`
- `obtener_testers_admin()`
- `obtener_errores_admin()`
- `marcar_error_revisado(error_id_objetivo, nuevo_estado)`

Todas comprueban el acceso en el servidor; ocultar el HTML no es la medida de
seguridad.

## Próximos pasos

- Filtros de errores por cuenta, versión, origen y fecha.
- Contador de errores pendientes.
- Comunicaciones por correo con consentimiento y registro de envíos.
- Avisos importantes dentro de Atempo.

