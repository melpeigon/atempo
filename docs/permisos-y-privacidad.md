# Permisos y privacidad en Atempo

Este documento recoge el modelo de acceso que estamos diseñando para que una
familia pueda coordinar los planes de sus hijos sin tener que compartir
automáticamente la agenda privada de cada adulto.

## Conceptos

- **Cuenta:** pertenece a un adulto que inicia sesión en Atempo.
- **Familia:** espacio común al que pueden pertenecer varias cuentas adultas.
- **Persona:** ficha de agenda, por ejemplo un hijo o uno de los adultos.
- **Actividad:** plan asociado a una persona. Puede ser privado o compartido.
- **Miembro:** cuenta adulta que ha sido invitada y aceptada en una familia.

Los hijos son personas de la agenda, no necesitan una cuenta propia. Los adultos
son quienes inician sesión y reciben permisos.

## Acuerdos actuales

| Contenido | Visibilidad inicial | Quién puede editarlo |
| --- | --- | --- |
| Ficha y actividades de un hijo | Compartidas con los adultos de la familia | Solo quien creó cada actividad |
| Ficha y actividades personales de un adulto | Privadas para ese adulto | Solo ese adulto |
| Actividad privada de un hijo | Solo quien la creó | Solo quien la creó |
| Preferencias de notificaciones | Cuenta y dispositivo de cada adulto | Ese adulto |

Al crear una actividad, el formulario mostrará un control amable, por ejemplo
**«Compartir este plan con la familia»**. Estará activado por defecto en las
personas compartidas, como los hijos, y desactivado en el perfil personal de un
adulto. La persona podrá cambiarlo para cada actividad.

Los demás adultos podrán consultar las actividades compartidas de los hijos,
pero no editarlas ni borrarlas si no las crearon. Cada adulto gestionará sus
propias actividades. Ser miembro o administrador de una familia no dará permiso
para modificar actividades creadas por otra persona.

## Seguridad técnica prevista

- La visibilidad y la autoría se comprobarán en Supabase mediante políticas RLS;
  ocultar o desactivar botones en la interfaz no basta para proteger datos.
- Cada actividad deberá guardar quién la creó y si se comparte con la familia.
- Una persona o actividad privada solo podrá leerse por su creador.
- Una actividad compartida podrá leerse por los miembros de esa familia.
- Solo el creador podrá actualizar o borrar una actividad.
- Las invitaciones y la gestión de miembros deberán validar la identidad y los
  permisos en el servidor. Nunca se incluirá una clave secreta de Supabase en la
  aplicación web.
- El panel de administración de Atempo es independiente de las familias y no
  debe mostrar el contenido de sus agendas.

## Pendiente de decidir antes de implementarlo

1. **Responsabilidades de quien crea la familia:** quién puede invitar o quitar
   miembros y si ambos adultos pueden hacerlo.
2. **Actividades existentes:** Atempo todavía no guarda quién creó cada plan.
   Debemos decidir cómo asignar la autoría inicial al activar estos permisos.
3. **Salida de un miembro:** qué ocurre con las actividades compartidas que
   creó una persona cuando deja la familia.
4. **Invitaciones:** cómo se invita, cómo se acepta y cómo se revoca una
   invitación pendiente.
5. **Otros perfiles:** si en el futuro habrá cuidadores u otros miembros con
   permisos de solo lectura.

Estas decisiones no se han implementado aún. El modelo actual de la base de
datos y sus políticas de acceso todavía no garantizan esta separación entre
contenido privado y compartido.
