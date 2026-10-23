# Atempo

Atempo es una agenda familiar pensada para aliviar la carga mental de recordar
horarios, actividades y avisos. Cada persona tiene un color propio, y sus planes
se muestran en la agenda diaria y en el calendario.

La aplicación está actualmente en fase de pruebas con testers. La versión
configurada en el código es la **1.3.0**.

## Funciones principales

- Cuentas de usuario y agendas familiares independientes.
- Personas identificadas mediante nombre, color e icono.
- Actividades puntuales, semanales, mensuales y anuales.
- Agenda del día y calendario mensual.
- Actividades personalizadas y recordatorios.
- Avisos individuales, aviso un día antes y resumen diario.
- Instalación como PWA en Android, iPhone y ordenador.
- Notificaciones push aunque Atempo esté cerrada.
- Panel privado para seguimiento de testers, versiones y errores técnicos.

## Tecnologías

- HTML, CSS y JavaScript sin framework.
- Supabase para autenticación, PostgreSQL, RLS y Edge Functions.
- Web Push para las notificaciones.
- Service worker y Web App Manifest para la instalación como PWA.
- GitHub Pages para la versión de prueba.

## Estructura básica

```text
index.html                  Aplicación principal
admin.html                  Panel privado de administración
css/                        Estilos separados por pantalla
js/                         Comportamiento de la aplicación
sql/                        Evolución de la base de datos y su seguridad
supabase/functions/         Procesamiento de notificaciones en el servidor
Branding/                   Logos, iconos y guía visual
docs/                       Documentación técnica y funcional
service-worker.js           Caché, PWA y recepción de notificaciones
manifest.json               Identidad instalable de Atempo
PENDIENTES.md               Hoja de ruta
CHANGELOG.md                Historial de versiones
```

## Ejecutar en local

Atempo no necesita compilación ni `npm install`.

1. Abre la carpeta del proyecto en Visual Studio Code.
2. Inicia Live Server desde `index.html`.
3. Abre la dirección local que muestre Live Server.
4. Para revisar el panel, abre `admin.html` con una cuenta incluida en la tabla
   `administradores`.

La aplicación necesita conexión con el proyecto de Supabase configurado en
`js/supabase.js`. Ese archivo solo debe contener datos públicos del cliente;
nunca claves secretas.

## Base de datos

Los archivos de `sql/` documentan los cambios realizados en Supabase y deben
ejecutarse en orden numérico al reconstruir un proyecto nuevo. Las políticas
RLS aíslan los datos de cada familia.

Más información:

- [Diseño de la base de datos](docs/diseno-base-datos.md)
- [Permisos y privacidad](docs/permisos-y-privacidad.md)
- [Panel de administración](docs/panel-administracion.md)
- [Sistema de notificaciones](docs/notificaciones.md)
- [Historial de cambios](CHANGELOG.md)

## Publicación de prueba

La PWA de prueba se publica mediante GitHub Pages:

[Abrir Atempo](https://melpeigon.github.io/atempo/)

Al publicar cambios puede ser necesario cerrar y volver a abrir la PWA para que
el service worker instale la nueva versión.

## Privacidad y estado legal

El panel se limita a información técnica de soporte y no muestra el contenido
de las agendas familiares. Los registros de errores no deben guardar
contraseñas, nombres de actividades ni otra información privada.

El proyecto todavía no tiene una licencia de código abierto. Antes de una
publicación comercial deben completarse la política de privacidad, el aviso
legal y los procedimientos de exportación y eliminación de datos.

