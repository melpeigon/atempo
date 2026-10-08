// Comunicación entre la interfaz de Atempo y las tablas de Supabase.

function convertirPersonaDeSupabase(persona) {
  return {
    id: persona.id,
    nombre: persona.nombre,
    color: persona.color,
    icono: persona.icono,
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
    recurrencia: actividad.recurrencia,
    dias: actividad.dias || [],
    aviso: actividad.tipo_aviso,
    horaAviso: actividad.hora_aviso ? actividad.hora_aviso.slice(0, 5) : "",
    incluirResumen: actividad.incluir_resumen,
    recordatorio: actividad.recordatorio || "",
  };
}

function convertirActividadParaSupabase(actividad) {
  return {
    persona_id: actividad.personaId,
    tipo_actividad: actividad.actividad,
    nombre_personalizado: actividad.nombrePersonalizado || null,
    fecha_inicio: actividad.fecha,
    hora: actividad.hora,
    recurrencia: actividad.recurrencia,
    dias: actividad.dias,
    tipo_aviso: actividad.aviso,
    hora_aviso: actividad.horaAviso || null,
    incluir_resumen: actividad.incluirResumen,
    recordatorio: actividad.recordatorio || null,
  };
}

function actualizarPantallasConDatosCargados() {
  renderizarPersonas();
  renderizarActividadesDeHoy();
  mostrarMes();
}

async function cargarDatosDeSupabase() {
  const resultadoPersonas = await clienteSupabase
    .from("personas")
    .select("id, nombre, color, icono")
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
  actualizarPantallasConDatosCargados();
}
