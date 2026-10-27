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
| Ficha de una persona (nombre, icono y color) | Los miembros adultos de la familia | Ambos pueden editar fichas infantiles y perfiles adultos sin cuenta; cada adulto edita su propio perfil vinculado |
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
marcar «Permitir que edite mis actividades compartidas». El permiso solo cubre
planes compartidos de perfiles a los que la otra cuenta tiene acceso; nunca
incluye planes privados. Quien recibe el permiso puede editar, pero solo quien
creó cada actividad puede borrarla. La propietaria puede cambiar este permiso
más tarde desde la gestión de miembros. Supabase aplica estas reglas mediante
RLS; los controles de la interfaz solo reflejan el permiso.

Borrar una ficha infantil requerirá confirmación explícita e indicará que
también se borrarán sus actividades asociadas. En el esquema actual,
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

### Persona invitada con una cuenta y agenda existentes

La familia de quien invita será la referencia para los hijos compartidos: se
conservarán sus fichas y actividades. Para evitar duplicados, no se importarán
las fichas ni las actividades infantiles de la agenda existente de la persona
invitada. Antes de descartar esos datos, Atempo avisará claramente y pedirá
confirmación.

Las actividades personales del adulto invitado no se deben borrar ni compartir
por esta decisión; se conservarán como privadas. La forma técnica de trasladar
esas actividades y su perfil personal a la familia compartida debe resolverse
antes de activar la aceptación para cuentas existentes.

## 5. Salida de un miembro

Si un adulto abandona la familia, se avisará al adulto que permanece y se le
preguntará qué hacer con los planes compartidos de los hijos creados por quien
se marcha:

- **Conservarlos:** transferir su autoría al adulto que permanece.
- **Eliminarlos:** borrar esos planes compartidos.

Esta decisión se refiere a los planes de los hijos, no a las actividades
personales privadas del adulto que se marcha. La salida también debe revocar su
acceso a la familia. El tratamiento posterior de sus datos privados deberá
respetar esa separación.

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
visibilidad, y aplican las políticas RLS iniciales. La selección de agenda y el
flujo de aceptar invitaciones ya existen.

La migración `sql/037_permisos_perfiles_y_actividades.sql` ya se ejecutó en el
proyecto de pruebas. `sql/038_permisos_edicion_compartida.sql` está preparada
localmente y debe ejecutarse en Supabase antes de probar la nueva autorización.
Los cambios de interfaz y políticas todavía deben validarse con dos cuentas;
no se deben ofrecer a testers aún. Esta fase añade:

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
resuelta por las funciones y políticas de Supabase. Primero se validará en local
con dos cuentas, incluyendo revocar permisos y confirmar que los datos siguen
existiendo aunque una cuenta deje de verlos.

Quedan para fases posteriores la gestión formal de salida/transferencia de un
miembro, el onboarding de nuevos miembros y una vista combinada que reúna la
agenda propia con los perfiles compartidos sin mostrar al otro adulto.

La posibilidad futura de incluir cuidadores u otros miembros con permisos de
solo lectura queda fuera de esta primera versión.
