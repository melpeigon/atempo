# Familias, permisos y privacidad en Atempo

Este documento resume el modelo acordado para que varios adultos puedan
coordinar los planes de sus hijos sin compartir automáticamente sus agendas
personales. Describe el comportamiento deseado; no todo está implementado aún.

## 1. Conceptos

- **Cuenta adulta:** cuenta de `auth.users`, con la que una persona inicia
  sesión. Los hijos no necesitan cuenta.
- **Familia:** espacio compartido en el que se organizan las personas y sus
  actividades. La familia se identifica por un UUID, no por su nombre visible.
- **Miembro:** relación entre una cuenta adulta y una familia, guardada en
  `miembros_familia`.
- **Rol de miembro:** permiso para gestionar la familia. Inicialmente se
  conservan `propietaria` y `miembro`; no indican si alguien es padre o hijo.
- **Persona:** ficha de agenda asociada a una familia. Tendrá un tipo, por
  ejemplo `adulto` o `menor` (en la interfaz se puede mostrar como «Hijo/a»).
  La ficha de un adulto con cuenta se vinculará con esa cuenta; una ficha
  infantil no tendrá cuenta propia.
- **Actividad:** plan asociado a una persona. Guardará quién lo creó y si es
  privado o compartido.

Para hablar de la experiencia actual, se puede llamar **agenda personal** al
espacio que se crea al registrar una cuenta. El objetivo de las familias
compartidas es que la familia represente el grupo común, no una persona adulta.

## 2. Relaciones entre los datos

```text
Cuenta adulta (auth.users)
        │
        └── miembros_familia ── rol: propietaria / miembro
                    │
                    ▼
             Familia compartida
                    │
                    ├── Personas
                    │     ├── Adultos (vinculados a una cuenta)
                    │     └── Hijos (sin cuenta)
                    │
                    └── Actividades
                          ├── persona a quien corresponde
                          ├── cuenta que la creó
                          └── privada o compartida
```

Una familia puede tener varios miembros adultos y varias personas. Cada
actividad pertenece a una persona; la autoría y la visibilidad determinan qué
adultos pueden verla, editarla o borrarla.

## 3. Visibilidad y edición acordadas

| Contenido | Quién puede verlo | Quién puede editarlo o borrarlo |
| --- | --- | --- |
| Ficha de una persona (nombre, icono y color) | Los miembros adultos autorizados | Los miembros autorizados pueden editar según RLS; solo quien creó la ficha puede borrarla. En fichas antiguas sin autoría, la propietaria gestiona el borrado. |
| Actividad compartida de un hijo | Los miembros adultos con acceso a ese perfil | Quien la creó; la propietaria también puede autorizar a un miembro a editar sus planes compartidos |
| Actividad privada de un adulto | Solo ese adulto | Solo ese adulto |
| Actividad privada de un hijo | Solo quien la creó | Solo quien la creó |
| Preferencias de notificaciones | La cuenta y sus dispositivos | Ese adulto |
| Invitaciones y gestión de miembros | Inicialmente, la propietaria | Inicialmente, la propietaria |

Cuando otra cuenta tiene acceso al perfil de un menor, sus nuevas actividades
se compartirán por defecto. Aun así, quien crea cada actividad puede marcarla
como privada, también si corresponde a un hijo. Si el perfil aún no está
compartido con nadie, las actividades nuevas quedan privadas. En los perfiles
adultos, la visibilidad depende igualmente del acceso al perfil y de la
elección de quien crea el plan.

Ser miembro de una familia no dará permiso automáticamente para modificar las
actividades nuevas creadas por otra persona. Al invitar, la propietaria puede
permitir que la persona invitada edite sus actividades compartidas. Al aceptar,
la persona invitada también puede decidir si permite que la propietaria edite
las suyas. Cada permiso solo cubre planes compartidos de perfiles a los que la
otra cuenta tiene acceso; nunca incluye planes privados. Quien recibe el permiso
puede editar, pero solo quien creó cada actividad puede borrarla. Ambos permisos
se pueden cambiar después desde «Agenda compartida». Supabase aplica estas
reglas mediante RLS; los controles de la interfaz solo reflejan el permiso.

Cada persona adulta conserva sus fichas propias. En la agenda conjunta puede
ver también las fichas compartidas por otro adulto, identificadas con el
indicador de perfil compartido. Las fichas parecidas o repetidas siguen siendo
registros independientes: Atempo no las fusiona. Cada adulto puede borrar las
fichas que creó; antes de confirmar, Atempo indica que también se borrarán sus
actividades asociadas. En las fichas antiguas cuya autoría no se pueda conocer,
la gestión del borrado queda reservada a la propietaria de la agenda. En el
esquema actual,
`actividades.persona_id` tiene `ON DELETE CASCADE`, por lo que eliminar una
persona elimina en cascada sus actividades.

### Actividades anteriores a los nuevos permisos

Las actividades antiguas de menores, que no tienen autor registrado, se
tratarán como planes compartidos: ambos adultos podrán consultarlas, editarlas
y borrarlas. Para evitar revelar planes personales antiguos, las actividades
sin autor asociadas a perfiles adultos solo serán visibles para el titular si
está vinculado; si no lo está, solo para la propietaria de la agenda. Las
actividades nuevas sí guardarán su autor y respetarán la visibilidad elegida.

## 4. Invitaciones

La primera versión del flujo será manual, sin envío automático de correo:

1. La propietaria introduce el correo de la persona invitada.
2. Atempo genera un enlace único, válido durante 7 días, y guarda el hash del
   token en `invitaciones_familia`, no el token legible.
3. La propietaria copia el enlace y lo envía por WhatsApp o por correo.
4. La persona invitada inicia sesión o crea una cuenta con ese mismo correo.
5. Atempo comprueba identidad, correo, caducidad y uso previo antes de añadirla
   como miembro. El enlace solo se puede aceptar una vez y la propietaria puede
   revocarlo.

Si la persona aún no tiene cuenta, el registro iniciado desde la invitación
deberá añadirla directamente a la familia que invita, sin crearle una familia
vacía adicional.

Cada cuenta conserva su propio perfil adulto en su agenda personal. Aceptar una
invitación solo añade la membresía y los permisos para consultar los perfiles
que la persona invitante eligió compartir; no crea otro perfil adulto ni mueve
los perfiles o actividades personales de quien acepta. La migración
`sql/043_aceptar_invitacion_sin_crear_perfil.sql` actualiza la función para que siga
este flujo.

Las invitaciones aceptadas con versiones anteriores pudieron crear una ficha
adulta adicional en la agenda compartida. No se elimina automáticamente porque
podría tener actividades asociadas; hay que revisar esos casos antes de limpiar
datos antiguos.

### Persona invitada con una cuenta y agenda existentes

La familia de quien invita será la referencia para los perfiles que decida
compartir. No se copian ni se fusionan fichas: cada cuenta conserva las que ya
tenía y la vista conjunta muestra también las compartidas. Si ambas cuentas
crearon una ficha del mismo hijo, aparecen como dos fichas independientes; la
persona invitada puede borrar la suya si ya no la necesita. Al borrarla, se
eliminan también sus actividades asociadas, previa confirmación.

Las actividades personales del adulto invitado no se deben borrar ni compartir
por esta decisión; se conservarán como privadas. La forma técnica de trasladar
esas actividades y su perfil personal a la familia compartida debe resolverse
antes de activar la aceptación para cuentas existentes.

## 5. Salida de un miembro

La propietaria puede retirar a un adulto desde el final de la tarjeta de
gestión de miembros en `invitaciones.html`. Antes de confirmar, elige qué hacer
con los planes compartidos de los hijos creados por esa persona:

- **Conservarlos:** transferir su autoría al adulto que permanece.
- **Eliminarlos:** borrar esos planes compartidos.

La operación revoca su acceso a esa agenda y sus permisos asociados. No elimina
su cuenta, perfiles, otras agendas ni actividades privadas o personales. La
transferencia de autoría se limita a actividades compartidas de perfiles
infantiles. La función transaccional `retirar_miembro_agenda` y la migración
`sql/041_dejar_de_compartir_agenda.sql` aplican esta regla en Supabase.

El adulto invitado también puede salir desde su propia página de invitaciones.
Puede copiar a su agenda propia los perfiles infantiles que tenía autorizados y
las actividades que podía consultar. La copia queda en su agenda y los originales
permanecen en la agenda compartida de la otra persona. Si elige no conservarlos,
solo pierde el acceso; los datos originales siguen en la agenda compartida. Las
copias son fichas independientes y no se fusionan con fichas propias del mismo
niño. La migración `sql/044_conservar_perfiles_compartidos_al_salir.sql` aplica
esta regla en la función de salida.

## 6. Incorporación y primeros pasos

Quien acepte una invitación verá una guía breve una sola vez para:

1. Confirmar a qué familia se ha unido.
2. Revisar o crear su perfil personal.
3. Entender qué planes son compartidos y quién puede editarlos.
4. Configurar las notificaciones en ese dispositivo.

## 7. Seguridad y límites

- No incluir claves secretas de Supabase en la aplicación web.
- Validar la creación, aceptación y revocación de invitaciones en funciones
  seguras de servidor/base de datos.
- Aplicar visibilidad y autoría con políticas RLS; no confiar solo en botones o
  filtros de JavaScript.
- Mantener el panel de administración de Atempo separado: no debe mostrar el
  contenido de las agendas familiares.
- No borrar automáticamente una familia ni sus datos al aceptar o abandonar
  una invitación. Las operaciones de borrado deben ser explícitas y confirmadas.

## 8. Estado actual y trabajo pendiente

Las migraciones `032` a `036` ya están ejecutadas en el proyecto de pruebas:
crean invitaciones seguras, añaden los campos de tipo, titularidad, autoría y
visibilidad, y aplican las políticas RLS iniciales. El flujo de aceptar
invitaciones ya existe; la pantalla principal ya no pide elegir una agenda.

Las migraciones `sql/037_permisos_perfiles_y_actividades.sql`,
`sql/038_permisos_edicion_compartida.sql` y
`sql/039_permiso_edicion_reciproco.sql` se han probado con dos cuentas. La
pantalla principal ya está preparada localmente para reunir las agendas
consultables, marcar perfiles compartidos y mantener fichas independientes.
La migración `sql/040_autoria_personas_agenda_unificada.sql` añade autoría de
fichas y limita su borrado mediante RLS. La migración
`sql/041_dejar_de_compartir_agenda.sql` añade la retirada segura de un miembro y
la elección de conservar o eliminar sus planes compartidos de menores. Debe
aplicarse en Supabase antes de usar el nuevo botón.
La migración `sql/042_salida_adulto_agenda_compartida.sql` añadió la salida
iniciada por el adulto invitado. La migración
`sql/044_conservar_perfiles_compartidos_al_salir.sql` actualiza su elección para
copiar los perfiles infantiles y los planes visibles a la agenda propia, sin
modificar los originales compartidos.
La migración `sql/045_permisos_edicion_al_aceptar_invitacion.sql` permite que la
persona invitada configure su permiso de edición al aceptar.

- selección de perfiles al invitar: menores marcados por defecto y adultos
  desmarcados;
- una sección para que la propietaria cambie los perfiles autorizados de un
  miembro que ya aceptó, útil para las pruebas actuales;
- aislamiento RLS para que cada cuenta solo reciba los perfiles autorizados;
- conservación del acceso actual de los miembros existentes a los perfiles
  infantiles, para que la migración no les vacíe la agenda de golpe;
- una casilla de visibilidad por actividad cuando el perfil se comparte con
  otra cuenta; permite mantener privado incluso un plan de un menor;
- valor privado por defecto cuando nadie más tiene acceso al perfil.
- opción previa a enviar una invitación para autorizar la edición de los planes
  compartidos creados por quien invita, desactivada por defecto;
- gestión posterior del permiso desde la página de invitaciones;
- edición delegada protegida por RLS, manteniendo el borrado exclusivo de quien
  creó el plan.

La interfaz solo facilita la elección. La autorización real debe seguir
resuelta por las funciones y políticas de Supabase. La agenda conjunta y sus
permisos se validarán en local con dos cuentas, incluyendo revocar accesos y
confirmar que los datos siguen existiendo aunque una cuenta deje de verlos.

Quedan pendientes la prueba completa de la agenda conjunta con dos cuentas,
incluyendo perfiles repetidos, actividades privadas, edición autorizada,
borrado de fichas propias y ambas formas de salir de una agenda; y el onboarding
de nuevos miembros.

La posibilidad futura de incluir cuidadores u otros miembros con permisos de
solo lectura queda fuera de esta primera versión.
