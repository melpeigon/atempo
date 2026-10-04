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
  ingles: "Inglés",
  padel: "Pádel",
  gym: "Gym",
  medico: "Médico",
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

      let avisosEnviados = 0;

      for (const configuracion of configuraciones || []) {
        avisosEnviados += await procesarUsuario(
          ctx.supabaseAdmin,
          configuracion,
          ahora,
        );
      }

      return Response.json({
        momento: ahora.toISO(),
        usuariosRevisados: configuraciones?.length || 0,
        avisosEnviados,
      });
    } catch (error) {
      console.log("No se pudieron procesar los avisos:", error);

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
    for (const actividad of actividades) {
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
    .select("familia_id")
    .eq("usuario_id", usuarioId);

  if (errorMembresias) {
    throw errorMembresias;
  }

  const familias = (membresias || []).map((membresia: any) =>
    membresia.familia_id
  );

  if (familias.length === 0) {
    return [];
  }

  const { data: personas, error: errorPersonas } = await supabase
    .from("personas")
    .select("id, nombre")
    .in("familia_id", familias);

  if (errorPersonas) {
    throw errorPersonas;
  }

  const nombresPersonas = new Map(
    (personas || []).map((persona: any) => [persona.id, persona.nombre]),
  );
  const idsPersonas = [...nombresPersonas.keys()];

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

  return (actividades || []).map((actividad: any) => ({
    ...actividad,
    nombre_persona: nombresPersonas.get(actividad.persona_id),
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

  const fechasCandidatas = [ahora.startOf("day"), ahora.plus({ days: 1 }).startOf("day")];

  for (const fecha of fechasCandidatas) {
    if (!actividadOcurreEnFecha(actividad, fecha)) {
      continue;
    }

    const momentoActividad = crearMomento(fecha, actividad.hora);
    let momentoAviso;

    if (actividad.tipo_aviso === "una-hora-antes") {
      momentoAviso = momentoActividad.minus({ hours: 1 });
    } else if (actividad.tipo_aviso === "un-dia-antes") {
      momentoAviso = momentoActividad.minus({ days: 1 });
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
      return `${actividad.hora.slice(0, 5)} · ${actividad.nombre_persona} · ${obtenerNombreActividad(actividad)}`;
    })
    .join("\n");

  const enviadas = await enviarADispositivos(supabase, dispositivos, {
    title: obtenerTituloResumen(ahora),
    body: `Hoy tenéis ${actividadesDeHoy.length} ${actividadesDeHoy.length === 1 ? "plan" : "planes"}:\n${resumen}`,
    url: "./",
    tag: clave,
  });

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

function obtenerTituloResumen(fecha: DateTime) {
  if (fecha.hour < 13) {
    return "Buenos días, ¿qué nos espera hoy?";
  }

  return "¡Hoolaa! Estos son los planes de esta tarde:";
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
  fechaActividad: string,
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
        await supabase
          .from("dispositivos_notificaciones")
          .update({ activo: false })
          .eq("id", dispositivo.id);
      }
    } catch (error) {
      console.log("Falló el envío a un dispositivo:", error);
    }
  }

  return enviadas;
}

function obtenerSecreto(nombre: string) {
  const valor = Deno.env.get(nombre);

  if (!valor) {
    throw new Error(`Falta el secreto ${nombre}.`);
  }

  return valor;
}
