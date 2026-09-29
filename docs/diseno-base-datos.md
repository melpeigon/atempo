# Diseño inicial de la base de datos de Atempo

Fecha: 29 de septiembre de 2026.

Este documento recoge el modelo de datos antes de crear las tablas reales. La primera versión tendrá una sola cuenta por familia, pero el diseño permitirá compartir la agenda con otras personas adultas en el futuro.

## Relaciones principales

```text
USUARIOS
    |
    v
MIEMBROS_FAMILIA <---- FAMILIAS
                         |
                         v
                      PERSONAS
                         |
                         v
                     ACTIVIDADES

USUARIOS
    |
    |-- CONFIGURACION_NOTIFICACIONES
    |
    `-- DISPOSITIVOS_NOTIFICACIONES
```

## Familias

Cada familia es un espacio independiente que agrupa sus personas y actividades.

Campos previstos:

- `id`: identificador único.
- `nombre`: nombre opcional de la familia.
- `created_at`: fecha de creación.

## Miembros de una familia

Tabla intermedia que relaciona las cuentas con las familias.

Campos previstos:

- `id`: identificador único.
- `familia_id`: familia a la que pertenece.
- `usuario_id`: cuenta de usuario.
- `rol`: `propietaria` o `miembro`.
- `created_at`: fecha de incorporación.

En la primera versión solo se utilizará el rol `propietaria`. Las invitaciones se incorporarán en una actualización futura.

## Personas

Representa a cada persona mostrada en la agenda.

Campos previstos:

- `id`: identificador único.
- `familia_id`: familia a la que pertenece.
- `nombre`: nombre visible.
- `color`: color asignado.
- `icono`: icono elegido.
- `created_at`: fecha de creación.

Si se elimina una persona, también se eliminarán sus actividades asociadas, igual que ocurre actualmente en Atempo.

## Actividades

Campos previstos:

- `id`: identificador único.
- `persona_id`: persona a la que pertenece.
- `tipo_actividad`: música, fútbol, médico, personalizada, etc.
- `nombre_personalizado`: nombre escrito cuando la actividad es personalizada.
- `fecha_inicio`: primera fecha de la actividad.
- `hora`: hora de la actividad.
- `recurrencia`: puntual, semanal, mensual o anual.
- `dias`: días seleccionados para una recurrencia semanal.
- `tipo_aviso`: sin aviso, una hora antes o a una hora concreta.
- `hora_aviso`: hora elegida para un aviso concreto.
- `incluir_resumen`: indica si aparece en el resumen diario.
- `recordatorio`: texto libre opcional.
- `created_at`: fecha de creación.
- `updated_at`: fecha de la última modificación.

## Configuración de notificaciones

Preferencias generales de una cuenta.

Campos previstos:

- `id`: identificador único.
- `usuario_id`: cuenta propietaria de la configuración.
- `modo`: solo actividades, solo resumen o ambos.
- `hora_resumen`: hora elegida para el resumen diario.
- `updated_at`: fecha de la última modificación.

## Dispositivos para notificaciones

Una misma cuenta puede utilizar varios móviles. Cada dispositivo necesita su propia suscripción para recibir avisos.

Campos previstos:

- `id`: identificador único.
- `usuario_id`: cuenta a la que pertenece el dispositivo.
- `suscripcion_push`: datos técnicos necesarios para enviar la notificación.
- `created_at`: fecha de registro.
- `ultima_actividad`: última vez que el dispositivo actualizó su suscripción.

## Datos que siguen siendo locales

Estos datos pertenecen al dispositivo y no necesitan guardarse en la base de datos:

- Si Atempo está instalada.
- Permiso concedido o denegado por el navegador.
- Pantalla o formulario que está abierto.
- Mes visible del calendario.
- Estados visuales temporales.

## Decisiones pendientes

- Elegir el proveedor y crear el proyecto de base de datos.
- Definir los tipos exactos de cada columna.
- Crear las reglas de seguridad para aislar los datos de cada familia.
- Decidir el método de registro e inicio de sesión.
- Diseñar la migración desde `localStorage`.
- Diseñar las invitaciones para compartir una familia en una versión futura.
