import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { sendPushNotification } from "npm:@mmmike/web-push/send";
import { DateTime } from "npm:luxon";

const ZONA_HORARIA = "Europe/Madrid";
const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const NOMBRES_ACTIVIDADES: Record<string, string> = {
  musica: "Música",
  catequesis: "Catequesis",
  futbol: "Fútbol",
  cumple: "Cumpleaños",
  peluqueria: "Peluquería",
  dentista: "Dentista",
  ingles: "Idiomas",
  idiomas: "Idiomas",
  padel: "Pádel",
  gym: "Gym",
  medico: "Médico",
  baloncesto: "Baloncesto",
  natacion: "Natación",
  running: "Running",
  "pilates-yoga": "Pilates / yoga",
  baile: "Baile",
  teatro: "Teatro",
  dibujo: "Dibujo",
  "apoyo-escolar": "Apoyo escolar",
  vacuna: "Vacuna",
  terapia: "Terapia",
  reunion: "Reunión / tutoría",
  excursion: "Excursión",
  festival: "Festival",
  "entrega-trabajo": "Entrega de trabajo",
  examen: "Examen",
  celebracion: "Celebración",
  estetica: "Estética",
};

export default {
  fetch: withSupabase({ auth: "secret" }, async (_peticion, ctx) => {
    try {
      const ahora = DateTime.now().setZone(ZONA_HORARIA).startOf("minute");
      const { data: configuraciones, error } = await ctx.supabaseAdmin
        .from("configuracion_notificaciones")
        .select("usuario_id, modo, hora_resumen");

      if (error) {
        throw error;
      }

      // Los cambios de más de cinco minutos ya no deben generar avisos tardíos.
      const { error: errorCaducidad } = await ctx.supabaseAdmin
        .from("notificaciones_cambios_actividad")
        .update({ procesado_at: ahora.toISO() })
        .is("procesado_at", null)
        .lt("created_at", ahora.minus({ minutes: 5 }).toISO());

      if (errorCaducidad) {
        throw errorCaducidad;
      }

      let avisosEnviados = 0;

      for (const configuracion of configuraciones || []) {
        try {
          avisosEnviados += await procesarUsuario(
            ctx.supabaseAdmin,
            configuracion,
            ahora,
          );
        } catch (error) {
          console.log(
            "No se pudieron procesar los avisos de una usuaria:",
            error,
          );
          await registrarErrorProcesador(
            ctx.supabaseAdmin,
            "Procesar avisos de una usuaria",
            error,
            configuracion.usuario_id,
          );
        }
      }

      return Response.json({
        momento: ahora.toISO(),
        usuariosRevisados: configuraciones?.length || 0,
        avisosEnviados,
      });
    } catch (error) {
      console.log("No se pudieron procesar los avisos:", error);
      await registrarErrorProcesador(
        ctx.supabaseAdmin,
        "Procesar avisos automáticos",
        error,
      );

      return Response.json(
        { error: "No se pudieron procesar los avisos." },
        { status: 500 },
      );
    }
  }),
};

async function procesarUsuario(supabase: any, configuracion: any, ahora: DateTime) {
  const dispositivos = await obtenerDispositivos(
    supabase,
    configuracion.usuario_id,
  );

  if (dispositivos.length === 0) {
    return 0;
  }

  const actividades = await obtenerActividades(
    supabase,
    configuracion.usuario_id,
  );
  let enviadas = 0;

  if (
    configuracion.modo === "solo-actividades" ||
    configuracion.modo === "resumen-y-actividades"
  ) {
    enviadas += await procesarCambiosActividad(
      supabase,
      configuracion.usuario_id,
      dispositivos,
      ahora,
    );

    for (const actividad of actividades) {
      enviadas += await procesarAvisoNuevoPlanCompartido(
        supabase,
        configuracion.usuario_id,
        actividad,
        dispositivos,
        ahora,
      );
      enviadas += await procesarAvisoActividad(
        supabase,
        configuracion.usuario_id,
        actividad,
        dispositivos,
        ahora,
      );
    }
  }

  if (
    configuracion.modo === "solo-resumen" ||
    configuracion.modo === "resumen-y-actividades"
  ) {
    enviadas += await procesarResumen(
      supabase,
      configuracion,
      actividades,
      dispositivos,
      ahora,
    );
  }

  return enviadas;
}

async function procesarAvisoNuevoPlanCompartido(
  supabase: any,
  usuarioId: string,
  actividad: any,
  dispositivos: any[],
  ahora: DateTime,
) {
  if (
    !actividad.creada_por ||
    actividad.creada_por === usuarioId ||
    actividad.visibilidad !== "compartida" ||
    !actividad.created_at
  ) {
    return 0;
  }

  const creadaEn = DateTime.fromISO(actividad.created_at).setZone(ZONA_HORARIA);
  if (
    !creadaEn.isValid ||
    creadaEn < ahora.minus({ minutes: 5 }) ||
    creadaEn > ahora.plus({ minutes: 1 })
  ) {
    return 0;
  }

  const clave = `nuevo-plan:${actividad.id}`;
  if (await avisoYaEnviado(supabase, usuarioId, clave)) {
    return 0;
  }

  const fecha = actividad.fecha_inicio
    ? DateTime.fromISO(actividad.fecha_inicio, { zone: ZONA_HORARIA })
    : null;
  const fechaVisible = fecha?.isValid ? fecha.toFormat("d LLL") : "";
  const horaVisible = actividad.hora ? actividad.hora.slice(0, 5) : "";
  const detalles = [fechaVisible, horaVisible].filter(Boolean).join(" · ");
  const contenido = {
    title: `Han añadido un nuevo plan para ${actividad.nombre_persona}`,
    body: [
      obtenerNombreActividad(actividad),
      detalles,
    ].filter(Boolean).join(" · "),
    url: "./",
    tag: clave,
  };

  const enviadas = await enviarADispositivos(
    supabase,
    usuarioId,
    dispositivos,
    contenido,
  );

  if (enviadas > 0) {
    await registrarAviso(
      supabase,
      usuarioId,
      actividad.id,
      clave,
      "actividad",
      actividad.fecha_inicio || null,
    );
    return 1;
  }

  return 0;
}

async function procesarCambiosActividad(
  supabase: any,
  usuarioId: string,
  dispositivos: any[],
  ahora: DateTime,
) {
  const { data: eventos, error } = await supabase
    .from("notificaciones_cambios_actividad")
    .select("*")
    .eq("destinatario_id", usuarioId)
    .is("procesado_at", null)
    .gte("created_at", ahora.minus({ minutes: 5 }).toISO())
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  let enviadas = 0;

  for (const evento of eventos || []) {
    const clave = `cambio-plan:${evento.id}`;

    if (await avisoYaEnviado(supabase, usuarioId, clave)) {
      const { error: errorProcesado } = await supabase
        .from("notificaciones_cambios_actividad")
        .update({ procesado_at: ahora.toISO() })
        .eq("id", evento.id);

      if (errorProcesado) {
        throw errorProcesado;
      }

      continue;
    }

    const fecha = evento.fecha_inicio
      ? DateTime.fromISO(evento.fecha_inicio, { zone: ZONA_HORARIA })
      : null;
    const fechaVisible = fecha?.isValid ? fecha.toFormat("d LLL") : "";
    const horaVisible = evento.hora ? String(evento.hora).slice(0, 5) : "";
    const detalles = [fechaVisible, horaVisible].filter(Boolean).join(" · ");
    const titulos: Record<string, string> = {
      añadida: `Han añadido un nuevo plan para ${evento.nombre_persona}`,
      modificada: `Han actualizado el plan de ${evento.nombre_persona}`,
      eliminada: `Han eliminado un plan de ${evento.nombre_persona}`,
    };
    const cambios = evento.tipo_evento === "modificada"
      ? formatearDetallesCambios(evento.detalles_cambio)
      : [];

    const contenido = {
      title: titulos[evento.tipo_evento] || "Ha cambiado un plan compartido",
      body: cambios.length > 0
        ? cambios.join(" · ")
        : [obtenerNombreActividad(evento), detalles].filter(Boolean).join(" · "),
      url: "./",
      tag: clave,
    };

    const dispositivosNotificados = await enviarADispositivos(
      supabase,
      usuarioId,
      dispositivos,
      contenido,
    );

    if (dispositivosNotificados > 0) {
      // No vinculamos el historial a la actividad: puede haberse eliminado.
      await registrarAviso(
        supabase,
        usuarioId,
        null,
        clave,
        "actividad",
        evento.fecha_inicio || null,
      );

      const { error: errorProcesado } = await supabase
        .from("notificaciones_cambios_actividad")
        .update({ procesado_at: ahora.toISO() })
        .eq("id", evento.id);

      if (errorProcesado) {
        throw errorProcesado;
      }

      enviadas++;
    }
  }

  return enviadas;
}

async function obtenerDispositivos(supabase: any, usuarioId: string) {
  const { data, error } = await supabase
    .from("dispositivos_notificaciones")
    .select("id, endpoint, clave_p256dh, clave_auth")
    .eq("usuario_id", usuarioId)
    .eq("activo", true);

  if (error) {
    throw error;
  }

  return data || [];
}

async function obtenerActividades(supabase: any, usuarioId: string) {
  const { data: membresias, error: errorMembresias } = await supabase
    .from("miembros_familia")
    .select("familia_id, rol")
    .eq("usuario_id", usuarioId);

  if (errorMembresias) {
    throw errorMembresias;
  }

  const rolesPorFamilia = new Map(
    (membresias || []).map((membresia: any) => [
      membresia.familia_id,
      membresia.rol,
    ]),
  );
  const familias = [...rolesPorFamilia.keys()];

  if (familias.length === 0) {
    return [];
  }

  const { data: personas, error: errorPersonas } = await supabase
    .from("personas")
    .select("id, nombre, familia_id, tipo_persona, usuario_id")
    .in("familia_id", familias);

  if (errorPersonas) {
    throw errorPersonas;
  }

  const { data: permisos, error: errorPermisos } = await supabase
    .from("permisos_personas_miembro")
    .select("familia_id, persona_id")
    .eq("usuario_id", usuarioId);

  if (errorPermisos) {
    throw errorPermisos;
  }

  const perfilesPermitidos = new Set(
    (permisos || []).map((permiso: any) =>
      `${permiso.familia_id}:${permiso.persona_id}`
    ),
  );
  const personasVisibles = (personas || []).filter((persona: any) => {
    const rol = rolesPorFamilia.get(persona.familia_id);
    return persona.usuario_id === usuarioId ||
      perfilesPermitidos.has(`${persona.familia_id}:${persona.id}`) ||
      (rol === "propietaria" &&
        (persona.tipo_persona === "menor" || persona.usuario_id === null));
  });
  const personaPorId = new Map(
    personasVisibles.map((persona: any) => [persona.id, persona]),
  );
  const idsPersonas = [...personaPorId.keys()];

  if (idsPersonas.length === 0) {
    return [];
  }

  const { data: actividades, error: errorActividades } = await supabase
    .from("actividades")
    .select("*")
    .in("persona_id", idsPersonas);

  if (errorActividades) {
    throw errorActividades;
  }

  return (actividades || [])
    .filter((actividad: any) => {
      const persona = personaPorId.get(actividad.persona_id);
      if (!persona) return false;

      // El procesador usa service_role, que omite RLS. Reproducimos aquí
      // el permiso de lectura para que no envíe avisos de perfiles/planes
      // que la persona destinataria no puede consultar en la aplicación.
      return actividad.creada_por === usuarioId ||
        actividad.visibilidad === "compartida" ||
        (actividad.creada_por == null &&
          (persona.tipo_persona === "menor" ||
            (persona.tipo_persona === "adulto" &&
              (persona.usuario_id === usuarioId ||
                rolesPorFamilia.get(persona.familia_id) === "propietaria"))));
    })
    .map((actividad: any) => ({
      ...actividad,
      nombre_persona: personaPorId.get(actividad.persona_id)?.nombre,
    }));
}

async function procesarAvisoActividad(
  supabase: any,
  usuarioId: string,
  actividad: any,
  dispositivos: any[],
  ahora: DateTime,
) {
  if (actividad.tipo_aviso === "sin-aviso") {
    return 0;
  }

  const fechasCandidatas = [
    ahora.startOf("day"),
    ahora.plus({ days: 1 }).startOf("day"),
    ahora.plus({ days: 2 }).startOf("day"),
  ];

  for (const fecha of fechasCandidatas) {
    if (!actividadOcurreEnFecha(actividad, fecha)) {
      continue;
    }

    const momentoActividad = crearMomento(fecha, actividad.hora);
    let momentoAviso;

    if (actividad.tipo_aviso === "una-hora-antes") {
      momentoAviso = momentoActividad.minus({ hours: 1 });
    } else if (actividad.tipo_aviso === "un-dia-antes") {
      momentoAviso = actividad.hora_aviso
        ? crearMomento(fecha.minus({ days: 1 }), actividad.hora_aviso)
        : momentoActividad.minus({ days: 1 });
    } else {
      momentoAviso = crearMomento(fecha, actividad.hora_aviso);
    }

    if (!momentoAviso.isValid || momentoAviso.toMillis() !== ahora.toMillis()) {
      continue;
    }

    const fechaActividad = fecha.toISODate();
    const clave = `actividad:${actividad.id}:${fechaActividad}:${actividad.tipo_aviso}`;

    if (await avisoYaEnviado(supabase, usuarioId, clave)) {
      return 0;
    }

    const nombreActividad = obtenerNombreActividad(actividad);
    const referenciaDia = actividad.tipo_aviso === "un-dia-antes"
      ? "Mañana"
      : "Hoy";
    const informacionActividad =
      `${referenciaDia} ${actividad.nombre_persona} tiene ${nombreActividad.toLowerCase()} a las ${actividad.hora.slice(0, 5)}.`;
    const mensaje = actividad.recordatorio
      ? `${informacionActividad} ${actividad.recordatorio}`
      : informacionActividad;
    const enviadas = await enviarADispositivos(
      supabase,
      usuarioId,
      dispositivos,
      {
        title: "Toc, toc 💜",
        body: mensaje,
        url: "./",
        tag: clave,
      },
    );

    if (enviadas > 0) {
      await registrarAviso(
        supabase,
        usuarioId,
        actividad.id,
        clave,
        "actividad",
        fechaActividad,
      );
      return 1;
    }
  }

  return 0;
}

async function procesarResumen(
  supabase: any,
  configuracion: any,
  actividades: any[],
  dispositivos: any[],
  ahora: DateTime,
) {
  const horaResumen = configuracion.hora_resumen.slice(0, 5);

  if (ahora.toFormat("HH:mm") !== horaResumen) {
    return 0;
  }

  const actividadesDeHoy = actividades.filter((actividad) =>
    actividad.incluir_resumen && actividadOcurreEnFecha(actividad, ahora)
  );

  if (actividadesDeHoy.length === 0) {
    return 0;
  }

  const fechaHoy = ahora.toISODate();
  const clave = `resumen:${fechaHoy}`;

  if (await avisoYaEnviado(supabase, configuracion.usuario_id, clave)) {
    return 0;
  }

  const resumen = actividadesDeHoy
    .sort((primera, segunda) => primera.hora.localeCompare(segunda.hora))
    .map(function (actividad) {
      const horario = actividad.hora_fin
        ? `${actividad.hora.slice(0, 5)}–${actividad.hora_fin.slice(0, 5)}`
        : actividad.hora.slice(0, 5);
      return `${horario} · ${actividad.nombre_persona} · ${obtenerNombreActividad(actividad)}`;
    })
    .join("\n");
  const nombreVisible = await obtenerNombreVisible(supabase, configuracion.usuario_id);

  const enviadas = await enviarADispositivos(
    supabase,
    configuracion.usuario_id,
    dispositivos,
    {
      title: obtenerTituloResumen(ahora, nombreVisible),
      body: `Hoy tenéis ${actividadesDeHoy.length} ${actividadesDeHoy.length === 1 ? "plan" : "planes"}:\n${resumen}`,
      url: "./",
      tag: clave,
    },
  );

  if (enviadas > 0) {
    await registrarAviso(
      supabase,
      configuracion.usuario_id,
      null,
      clave,
      "resumen",
      fechaHoy,
    );
    return 1;
  }

  return 0;
}

async function obtenerNombreVisible(supabase: any, usuarioId: string) {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(usuarioId);
    if (error) throw error;

    const nombre = data.user?.user_metadata?.nombre_visible;
    return typeof nombre === "string" && nombre.trim() ? nombre.trim() : null;
  } catch (error) {
    console.warn("No se pudo obtener el nombre para personalizar el resumen:", error);
    return null;
  }
}

function obtenerTituloResumen(fecha: DateTime, nombreVisible: string | null = null) {
  if (fecha.hour < 13) {
    return nombreVisible
      ? `Buenos días, ${nombreVisible}. ¿Qué nos espera hoy?`
      : "Buenos días, ¿qué nos espera hoy?";
  }

  return nombreVisible
    ? `¡Hoolaa, ${nombreVisible}! Estos son los planes de esta tarde:`
    : "¡Hoolaa! Estos son los planes de esta tarde:";
}

function actividadOcurreEnFecha(actividad: any, fecha: DateTime) {
  const fechaInicio = DateTime.fromISO(actividad.fecha_inicio, {
    zone: ZONA_HORARIA,
  }).startOf("day");

  if (fecha.toMillis() < fechaInicio.toMillis()) {
    return false;
  }

  if (actividad.recurrencia === "puntual") {
    return fecha.hasSame(fechaInicio, "day");
  }

  if (actividad.recurrencia === "semanal") {
    return (actividad.dias || []).includes(DIAS_SEMANA[fecha.weekday - 1]);
  }

  if (actividad.recurrencia === "mensual") {
    return fecha.day === Math.min(fechaInicio.day, fecha.daysInMonth || 31);
  }

  if (actividad.recurrencia === "anual") {
    if (fecha.month !== fechaInicio.month) {
      return false;
    }

    return fecha.day === Math.min(fechaInicio.day, fecha.daysInMonth || 31);
  }

  return false;
}

function crearMomento(fecha: DateTime, hora: string | null) {
  if (!hora) {
    return DateTime.invalid("No hay hora configurada");
  }

  const [horas, minutos] = hora.split(":").map(Number);
  return fecha.set({ hour: horas, minute: minutos, second: 0, millisecond: 0 });
}

function obtenerNombreActividad(actividad: any) {
  if (actividad.tipo_actividad === "personalizada") {
    return actividad.nombre_personalizado || "Actividad personalizada";
  }

  return NOMBRES_ACTIVIDADES[actividad.tipo_actividad] || "Actividad";
}

function formatearDetallesCambios(cambios: any): string[] {
  if (!cambios || typeof cambios !== "object") {
    return [];
  }

  const detalles: string[] = [];

  if (cambios.actividad) {
    detalles.push(formatearCambio(
      "Actividad",
      obtenerNombreActividad(cambios.actividad.antes),
      obtenerNombreActividad(cambios.actividad.despues),
    ));
  }

  if (cambios.persona) {
    detalles.push(formatearCambio(
      "Persona",
      cambios.persona.antes,
      cambios.persona.despues,
    ));
  }

  if (cambios.fecha) {
    detalles.push(formatearCambio(
      "Fecha",
      formatearFechaCambio(cambios.fecha.antes),
      formatearFechaCambio(cambios.fecha.despues),
    ));
  }

  if (cambios.hora) {
    detalles.push(formatearCambio(
      "Hora",
      formatearHoraCambio(cambios.hora.antes),
      formatearHoraCambio(cambios.hora.despues),
    ));
  }

  if (cambios.hora_fin) {
    detalles.push(formatearCambio(
      "Fin",
      formatearHoraCambio(cambios.hora_fin.antes) || "Sin hora de fin",
      formatearHoraCambio(cambios.hora_fin.despues) || "Sin hora de fin",
    ));
  }

  if (cambios.frecuencia) {
    detalles.push(formatearCambio(
      "Frecuencia",
      formatearFrecuencia(cambios.frecuencia.antes),
      formatearFrecuencia(cambios.frecuencia.despues),
    ));
  }

  if (cambios.aviso) {
    detalles.push(formatearCambio(
      "Aviso",
      formatearAviso(cambios.aviso.antes),
      formatearAviso(cambios.aviso.despues),
    ));
  }

  if (cambios.incluir_resumen) {
    detalles.push(formatearCambio(
      "Resumen diario",
      cambios.incluir_resumen.antes ? "Sí" : "No",
      cambios.incluir_resumen.despues ? "Sí" : "No",
    ));
  }

  if (cambios.recordatorio) {
    detalles.push(formatearCambio(
      "Recordatorio",
      cambios.recordatorio.antes || "Sin texto",
      cambios.recordatorio.despues || "Sin texto",
    ));
  }

  const visibles = detalles.slice(0, 3);
  if (detalles.length > visibles.length) {
    visibles.push(`y ${detalles.length - visibles.length} cambios más`);
  }

  return visibles;
}

function formatearCambio(etiqueta: string, anterior: any, nuevo: any) {
  return `${etiqueta}: ${acortarTexto(String(anterior ?? "—"))} → ${acortarTexto(String(nuevo ?? "—"))}`;
}

function acortarTexto(texto: string) {
  const limpio = texto.trim();
  return limpio.length > 38 ? `${limpio.slice(0, 35)}…` : limpio;
}

function formatearFechaCambio(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  const fechaValida = DateTime.fromISO(fecha, { zone: ZONA_HORARIA });
  return fechaValida.isValid ? fechaValida.toFormat("d LLL") : fecha;
}

function formatearHoraCambio(hora: string | null) {
  return hora ? String(hora).slice(0, 5) : "";
}

function formatearFrecuencia(frecuencia: any) {
  const nombres: Record<string, string> = {
    puntual: "Puntual",
    semanal: "Semanal",
    mensual: "Mensual",
    anual: "Anual",
  };
  const nombre = nombres[frecuencia?.recurrencia] || frecuencia?.recurrencia || "—";
  const dias = Array.isArray(frecuencia?.dias) && frecuencia.dias.length > 0
    ? ` (${frecuencia.dias.join(", ")})`
    : "";
  return `${nombre}${dias}`;
}

function formatearAviso(aviso: any) {
  const nombres: Record<string, string> = {
    "sin-aviso": "Sin aviso",
    "una-hora-antes": "1 hora antes",
    "un-dia-antes": "1 día antes",
    "hora-concreta": "A una hora concreta",
  };
  const nombre = nombres[aviso?.tipo_aviso] || aviso?.tipo_aviso || "Sin aviso";
  const hora = formatearHoraCambio(aviso?.hora_aviso);
  return hora && ["un-dia-antes", "hora-concreta"].includes(aviso?.tipo_aviso)
    ? `${nombre} (${hora})`
    : nombre;
}

async function avisoYaEnviado(supabase: any, usuarioId: string, clave: string) {
  const { data, error } = await supabase
    .from("avisos_enviados")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("clave", clave)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

async function registrarAviso(
  supabase: any,
  usuarioId: string,
  actividadId: string | null,
  clave: string,
  tipo: string,
  fechaActividad: string | null,
) {
  const { error } = await supabase.from("avisos_enviados").insert({
    usuario_id: usuarioId,
    actividad_id: actividadId,
    clave,
    tipo,
    fecha_actividad: fechaActividad,
  });

  if (error && error.code !== "23505") {
    throw error;
  }
}

async function enviarADispositivos(
  supabase: any,
  usuarioId: string,
  dispositivos: any[],
  contenido: { title: string; body: string; url: string; tag: string },
) {
  const vapid = {
    publicKey: obtenerSecreto("VAPID_PUBLIC_KEY"),
    privateKey: obtenerSecreto("VAPID_PRIVATE_KEY"),
    subject: obtenerSecreto("VAPID_SUBJECT"),
  };
  let enviadas = 0;

  for (const dispositivo of dispositivos) {
    try {
      const entregada = await sendPushNotification(
        {
          endpoint: dispositivo.endpoint,
          keys: {
            p256dh: dispositivo.clave_p256dh,
            auth: dispositivo.clave_auth,
          },
        },
        contenido,
        vapid,
      );

      if (entregada) {
        enviadas++;
      } else {
        await registrarErrorProcesador(
          supabase,
          "Enviar notificación push",
          {
            message: "El servicio push rechazó la notificación.",
            code: "PUSH_RECHAZADA",
          },
          usuarioId,
        );

        const { error: errorDesactivacion } = await supabase
          .from("dispositivos_notificaciones")
          .update({ activo: false })
          .eq("id", dispositivo.id);

        if (errorDesactivacion) {
          await registrarErrorProcesador(
            supabase,
            "Desactivar dispositivo rechazado",
            errorDesactivacion,
            usuarioId,
          );
        }
      }
    } catch (error) {
      console.log("Falló el envío a un dispositivo:", error);
      await registrarErrorProcesador(
        supabase,
        "Enviar notificación push",
        error,
        usuarioId,
      );
    }
  }

  return enviadas;
}

async function registrarErrorProcesador(
  supabase: any,
  contexto: string,
  error: any,
  usuarioId: string | null = null,
) {
  try {
    const mensaje = error?.message || String(error || "Error desconocido");
    const codigo = error?.code ? String(error.code) : null;

    const { error: errorRegistro } = await supabase
      .from("errores_app")
      .insert({
        usuario_id: usuarioId,
        origen: "procesador-avisos",
        contexto: contexto.slice(0, 80),
        mensaje: mensaje.slice(0, 500),
        codigo: codigo?.slice(0, 80) || null,
        plataforma: "Supabase Edge Function",
        pagina: "procesar-avisos",
      });

    if (errorRegistro) {
      console.log("No se pudo registrar el error del procesador:", errorRegistro);
    }
  } catch (errorRegistro) {
    console.log("No se pudo preparar el error del procesador:", errorRegistro);
  }
}

function obtenerSecreto(nombre: string) {
  const valor = Deno.env.get(nombre);

  if (!valor) {
    throw new Error(`Falta el secreto ${nombre}.`);
  }

  return valor;
}
