// Comunicación entre la interfaz de Atempo y las tablas de Supabase.

let perfilesCompartiblesActividad = new Set();
let autoresEditablesPorUsuario = new Set();
let usuarioActualId = null;

function convertirPersonaDeSupabase(persona) {
  return {
    id: persona.id,
    nombre: persona.nombre,
    color: persona.color,
    icono: persona.icono,
    tipoPersona: persona.tipo_persona,
    usuarioId: persona.usuario_id,
  };
}

function convertirActividadDeSupabase(actividad) {
  return {
    id: actividad.id,
    personaId: actividad.persona_id,
    actividad: actividad.tipo_actividad,
    nombrePersonalizado: actividad.nombre_personalizado || "",
    fecha: actividad.fecha_inicio,
    hora: actividad.hora ? actividad.hora.slice(0, 5) : "",
    horaFin: actividad.hora_fin ? actividad.hora_fin.slice(0, 5) : "",
    recurrencia: actividad.recurrencia,
    dias: actividad.dias || [],
    aviso: actividad.tipo_aviso,
    horaAviso: actividad.hora_aviso ? actividad.hora_aviso.slice(0, 5) : "",
    incluirResumen: actividad.incluir_resumen,
    recordatorio: actividad.recordatorio || "",
    visibilidad: actividad.visibilidad || null,
    creadaPor: actividad.creada_por || null,
  };
}

function convertirActividadParaSupabase(actividad) {
  const datosSupabase = {
    persona_id: actividad.personaId,
    tipo_actividad: actividad.actividad,
    nombre_personalizado: actividad.nombrePersonalizado || null,
    fecha_inicio: actividad.fecha,
    hora: actividad.hora,
    hora_fin: actividad.horaFin || null,
    recurrencia: actividad.recurrencia,
    dias: actividad.dias,
    tipo_aviso: actividad.aviso,
    hora_aviso: actividad.horaAviso || null,
    incluir_resumen: actividad.incluirResumen,
    recordatorio: actividad.recordatorio || null,
  };

  if (actividad.visibilidad !== undefined) {
    datosSupabase.visibilidad = actividad.visibilidad;
  }

  return datosSupabase;
}

function actualizarPantallasConDatosCargados() {
  renderizarPersonas();
  renderizarActividadesDeHoy();
  mostrarMes();
}

async function cargarDatosDeSupabase() {
  const { data: datosUsuario } = await clienteSupabase.auth.getUser();
  usuarioActualId = datosUsuario.user?.id || null;

  const resultadoPersonas = await clienteSupabase
    .from("personas")
    .select("id, nombre, color, icono, tipo_persona, usuario_id")
    .eq("familia_id", familiaActual.id)
    .order("created_at", { ascending: true });

  if (resultadoPersonas.error) {
    console.log(
      "No se pudieron cargar las personas:",
      resultadoPersonas.error
    );

    registrarErrorApp(
      "Cargar personas",
      resultadoPersonas.error
    );

    return false;
  }

  const resultadoPerfilesCompartibles = await clienteSupabase.rpc("obtener_perfiles_compartibles");
  perfilesCompartiblesActividad = new Set(
    resultadoPerfilesCompartibles.error ? [] : resultadoPerfilesCompartibles.data || []
  );

  const resultadoAutoresEditables = await clienteSupabase.rpc("obtener_autores_editables", {
    familia_consultada: familiaActual.id,
  });
  autoresEditablesPorUsuario = new Set(
    resultadoAutoresEditables.error ? [] : resultadoAutoresEditables.data || []
  );

  const idsPersonas = resultadoPersonas.data.map(function (persona) {
    return persona.id;
  });

  let actividadesDescargadas = [];

  if (idsPersonas.length > 0) {
    const resultadoActividades = await clienteSupabase
      .from("actividades")
      .select("*")
      .in("persona_id", idsPersonas)
      .order("fecha_inicio", { ascending: true })
      .order("hora", { ascending: true });

    if (resultadoActividades.error) {
      console.log(
        "No se pudieron cargar las actividades:",
        resultadoActividades.error
      );

      registrarErrorApp(
        "Cargar actividades",
        resultadoActividades.error
      );

      return false;
    }

    actividadesDescargadas = resultadoActividades.data;
  }

  personas.splice(
    0,
    personas.length,
    ...resultadoPersonas.data.map(convertirPersonaDeSupabase)
  );

  actividades.splice(
    0,
    actividades.length,
    ...actividadesDescargadas.map(convertirActividadDeSupabase)
  );

  actualizarPantallasConDatosCargados();
  console.log("Agenda cargada desde Supabase:", personas.length, "personas y", actividades.length, "actividades");

  return true;
}

function vaciarDatosDeLaAgenda() {
  personas.splice(0, personas.length);
  actividades.splice(0, actividades.length);
  autoresEditablesPorUsuario = new Set();
  actualizarPantallasConDatosCargados();
}
