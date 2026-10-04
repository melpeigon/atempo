// Datos compartidos de las actividades

const rutasIconosActividades = {
  musica: "Branding/iconos/SVG/musica.svg",
  catequesis: "Branding/iconos/SVG/catequesis.svg",
  futbol: "Branding/iconos/SVG/futbol.svg",
  cumple: "Branding/iconos/SVG/cumplea%C3%B1os.svg",
  peluqueria: "Branding/iconos/SVG/peluqueria.svg",
  dentista: "Branding/iconos/SVG/dentista.svg",
  ingles: "Branding/iconos/SVG/tarea.svg",
  padel: "Branding/iconos/SVG/pael.svg",
  gym: "Branding/iconos/SVG/gym.svg",
  medico: "Branding/iconos/SVG/medico.svg",
  personalizada: "Branding/iconos/SVG/personalizado.svg",
};

const nombresActividades = {
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
  personalizada: "Personalizada",
};

function obtenerNombreActividad(actividad) {
  if (actividad.actividad === "personalizada") {
    return actividad.nombrePersonalizado || "Actividad personalizada";
  }

  return nombresActividades[actividad.actividad] || "Actividad";
}

// Estos datos se cargan desde Supabase después de iniciar sesión.
const actividades = [];

let idActividadSeleccionada = null;
let origenFichaActividad = "inicio";
let fechaOcurrenciaFichaActividad = null;

const fechaActual = new Date();
const anoActual = fechaActual.getFullYear();
const mesActual = String(fechaActual.getMonth() + 1).padStart(2, "0");
const diaActual = String(fechaActual.getDate()).padStart(2, "0");

const nombresDiasSemana = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

// Elementos de la agenda de hoy

const numeroPlanesHoy = document.querySelector("#numero-planes-hoy");
const mensajeSinPlanes = document.querySelector("#mensaje-sin-planes");
const listaActividadesHoy = document.querySelector("#lista-actividades-hoy");

// Elementos de la ficha de actividad

const fichaActividad = document.querySelector("#ficha-actividad");
const contenidoFichaActividad = document.querySelector("#contenido-ficha-actividad");
const botonVolverActividad = document.querySelector("#boton-volver-actividad");
const botonEditarActividad = document.querySelector("#boton-editar-actividad");
const botonEliminarActividad = document.querySelector("#boton-eliminar-actividad");

function obtenerUltimoDiaDelMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function convertirFechaAFormatoInput(fecha) {
  const ano = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function convertirTextoEnFecha(fecha) {
  const partesFecha = fecha.split("-");

  return new Date(
    Number(partesFecha[0]),
    Number(partesFecha[1]) - 1,
    Number(partesFecha[2])
  );
}

function actividadOcurreEnFecha(actividad, fechaConsultada) {
  const fechaConsultadaFormatoInput = convertirFechaAFormatoInput(fechaConsultada);

  if (actividad.fecha > fechaConsultadaFormatoInput) {
    return false;
  }

  if (actividad.recurrencia === "puntual") {
    return actividad.fecha === fechaConsultadaFormatoInput;
  }

  if (actividad.recurrencia === "semanal") {
    const nombreDia = nombresDiasSemana[fechaConsultada.getDay()];
    return (actividad.dias || []).includes(nombreDia);
  }

  if (actividad.recurrencia === "mensual") {
    const numeroDiaActividad = Number(actividad.fecha.split("-")[2]);
    const ultimoDiaMes = obtenerUltimoDiaDelMes(
      fechaConsultada.getFullYear(),
      fechaConsultada.getMonth() + 1
    );
    const diaActividadEsteMes = Math.min(numeroDiaActividad, ultimoDiaMes);

    return diaActividadEsteMes === fechaConsultada.getDate();
  }

  if (actividad.recurrencia === "anual") {
    const partesFechaActividad = actividad.fecha.split("-");
    const mesActividad = Number(partesFechaActividad[1]);
    const numeroDiaActividad = Number(partesFechaActividad[2]);
    const mesConsultado = fechaConsultada.getMonth() + 1;

    if (mesActividad !== mesConsultado) {
      return false;
    }

    const ultimoDiaMes = obtenerUltimoDiaDelMes(
      fechaConsultada.getFullYear(),
      mesConsultado
    );
    const diaActividadEsteAno = Math.min(numeroDiaActividad, ultimoDiaMes);

    return diaActividadEsteAno === fechaConsultada.getDate();
  }

  return false;
}

function obtenerProximaFechaActividad(actividad) {
  const ahora = new Date();
  const horaActual =
    `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  let fechaBuscada = new Date(hoy);
  const fechaInicio = convertirTextoEnFecha(actividad.fecha);

  if (fechaInicio > fechaBuscada) {
    fechaBuscada = fechaInicio;
  }

  for (let diasRevisados = 0; diasRevisados <= 370; diasRevisados++) {
    if (actividadOcurreEnFecha(actividad, fechaBuscada)) {
      const esHoy = convertirFechaAFormatoInput(fechaBuscada) === convertirFechaAFormatoInput(hoy);
      const yaHaPasado = esHoy && actividad.hora < horaActual;

      if (!yaHaPasado) {
        return new Date(fechaBuscada);
      }
    }

    fechaBuscada.setDate(fechaBuscada.getDate() + 1);
  }

  return null;
}

function obtenerActividadesDeHoy() {
  const hoy = new Date();
  const actividadesDeHoy = actividades.filter(function (actividad) {
    return actividadOcurreEnFecha(actividad, hoy);
  });

  return actividadesDeHoy;
}

function actividadYaHaPasadoHoy(actividad) {
  if (!actividad.hora) {
    return false;
  }

  const ahora = new Date();
  const horaActual =
    `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

  return actividad.hora < horaActual;
}

function formatearFechaActividad(fecha) {
  if (!fecha) {
    return "Fecha no disponible";
  }

  const partesFecha = fecha.split("-");

  const ano = Number(partesFecha[0]);
  const mes = Number(partesFecha[1]) - 1;
  const dia = Number(partesFecha[2]);

  const fechaCompleta = new Date(ano, mes, dia);

  return fechaCompleta.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function crearDatoFichaActividad(rutaIcono, texto, clase) {
  const datoFichaActividad = document.createElement("div");
  datoFichaActividad.classList.add("dato-ficha-actividad", clase);

  const iconoDatoActividad = document.createElement("img");
  iconoDatoActividad.src = rutaIcono;
  iconoDatoActividad.alt = "";

  const textoDatoActividad = document.createElement("p");
  textoDatoActividad.textContent = texto;

  datoFichaActividad.append(
    iconoDatoActividad,
    textoDatoActividad
  );

  return datoFichaActividad;
}

function obtenerTextoAvisoActividad(actividad) {
  if (actividad.aviso === "una-hora-antes") {
    return "Aviso 1 hora antes";
  }

  if (actividad.aviso === "un-dia-antes") {
    return "Aviso 1 día antes";
  }

  if (actividad.aviso === "hora-concreta") {
    return `Aviso a las ${actividad.horaAviso}`;
  }

  return "Sin aviso";
}

function abrirFichaActividad(
  idActividad,
  nuevoOrigen,
  guardarEnHistorial = true,
  fechaOcurrencia = null
) {
  const actividadSeleccionada = actividades.find(function (actividad) {
    return actividad.id === idActividad;
  });

  if (!actividadSeleccionada) {
    return;
  }

  const personaActividad = personas.find(function (persona) {
    return persona.id === actividadSeleccionada.personaId;
  });

  if (!personaActividad) {
    return;
  }

  if (nuevoOrigen) {
    origenFichaActividad = nuevoOrigen;
  }

  idActividadSeleccionada = idActividad;
  fechaOcurrenciaFichaActividad = fechaOcurrencia;
  contenidoFichaActividad.replaceChildren();
  contenidoFichaActividad.style.setProperty(
    "--color-persona",
    personaActividad.color
  );

  const cabeceraFichaActividad = document.createElement("div");
  cabeceraFichaActividad.classList.add("cabecera-ficha-actividad");

  const tituloFichaActividad = document.createElement("div");
  tituloFichaActividad.classList.add("titulo-ficha-actividad");

  const iconoFichaActividad = document.createElement("div");
  iconoFichaActividad.classList.add("icono-ficha-actividad");

  const imagenFichaActividad = document.createElement("img");
  imagenFichaActividad.src = rutasIconosActividades[actividadSeleccionada.actividad];
  imagenFichaActividad.alt = "";

  iconoFichaActividad.append(imagenFichaActividad);

  const nombreFichaActividad = document.createElement("h2");
  nombreFichaActividad.textContent = obtenerNombreActividad(actividadSeleccionada);

  const personaFichaActividad = document.createElement("p");
  personaFichaActividad.classList.add("persona-ficha-actividad");
  personaFichaActividad.textContent = personaActividad.nombre;

  tituloFichaActividad.append(
    nombreFichaActividad,
    personaFichaActividad
  );

  cabeceraFichaActividad.append(
    tituloFichaActividad,
    iconoFichaActividad
  );

  const horarioFichaActividad = document.createElement("div");
  horarioFichaActividad.classList.add("horario-ficha-actividad");

  const fechaParaMostrar =
    fechaOcurrenciaFichaActividad || actividadSeleccionada.fecha;

  const fechaFichaActividad = crearDatoFichaActividad(
    "Branding/iconos/SVG/dia.svg",
    formatearFechaActividad(fechaParaMostrar),
    "fecha-ficha-actividad"
  );

  const horaFichaActividad = crearDatoFichaActividad(
    "Branding/iconos/SVG/hora.svg",
    actividadSeleccionada.hora,
    "hora-ficha-actividad"
  );

  let textoRecurrencia;

  if (actividadSeleccionada.recurrencia === "semanal") {
    const diasBonitos = actividadSeleccionada.dias.map(function (dia) {
      return dia.charAt(0).toUpperCase() + dia.slice(1);
    });

    textoRecurrencia = `Semanal · ${diasBonitos.join(", ")}`;
  } else if (actividadSeleccionada.recurrencia === "mensual") {
    textoRecurrencia = "Mensual";
  } else if (actividadSeleccionada.recurrencia === "anual") {
    textoRecurrencia = "Anual";
  } else {
    textoRecurrencia = "Puntual";
  }

  const recurrenciaFichaActividad = crearDatoFichaActividad(
    "Branding/iconos/SVG/recurrente.svg",
    textoRecurrencia,
    "recurrencia-ficha-actividad"
  );

  const avisoFichaActividad = crearDatoFichaActividad(
    "Branding/iconos/SVG/recordatorio.svg",
    obtenerTextoAvisoActividad(actividadSeleccionada),
    "aviso-ficha-actividad"
  );

  horarioFichaActividad.append(
    fechaFichaActividad,
    horaFichaActividad,
    recurrenciaFichaActividad,
    avisoFichaActividad
  );

  contenidoFichaActividad.append(
    cabeceraFichaActividad,
    horarioFichaActividad
  );

  if (actividadSeleccionada.recordatorio !== "") {
    const recordatorioFichaActividad = crearDatoFichaActividad(
      "Branding/iconos/SVG/recordatorio.svg",
      actividadSeleccionada.recordatorio,
      "recordatorio-ficha-actividad"
    );

    contenidoFichaActividad.append(recordatorioFichaActividad);
  }

  pantallaInicio.hidden = true;
  fichaPersona.hidden = true;
  fichaActividad.hidden = false;

  if (guardarEnHistorial) {
    registrarPantalla("actividad", {
      idActividad: idActividad,
      origen: origenFichaActividad,
      fechaOcurrencia: fechaOcurrenciaFichaActividad,
    });
  }
}

function volverDesdeActividad() {
  history.back();
}

function renderizarActividadesDeHoy() {
  const actividadesDeHoy = obtenerActividadesDeHoy();

  listaActividadesHoy.replaceChildren();

  if (actividadesDeHoy.length === 0) {
    mensajeSinPlanes.hidden = false;
  } else {
    mensajeSinPlanes.hidden = true;
  }

  if (actividadesDeHoy.length === 1) {
    numeroPlanesHoy.textContent = "1 Plan";
  } else {
    numeroPlanesHoy.textContent = `${actividadesDeHoy.length} Planes`;
  }

  actividadesDeHoy.sort(function (primeraActividad, segundaActividad) {
    const primeraHaPasado = actividadYaHaPasadoHoy(primeraActividad);
    const segundaHaPasado = actividadYaHaPasadoHoy(segundaActividad);

    if (primeraHaPasado !== segundaHaPasado) {
      return primeraHaPasado ? 1 : -1;
    }

    return primeraActividad.hora.localeCompare(segundaActividad.hora);
  });

  const hayActividadesPasadas = actividadesDeHoy.some(actividadYaHaPasadoHoy);
  let grupoMostrado = null;

  for (const actividad of actividadesDeHoy) {
    const personaActividad = personas.find(function (persona) {
      return persona.id === actividad.personaId;
    });

    if (!personaActividad) {
      continue;
    }

    const actividadHaPasado = actividadYaHaPasadoHoy(actividad);
    const grupoActividad = actividadHaPasado ? "pasadas" : "proximas";

    if (hayActividadesPasadas && grupoActividad !== grupoMostrado) {
      const tituloGrupo = document.createElement("p");
      tituloGrupo.classList.add("titulo-grupo-actividades");
      tituloGrupo.textContent = actividadHaPasado
        ? "Ya han pasado"
        : "Próximos planes";

      if (actividadHaPasado) {
        tituloGrupo.classList.add("titulo-actividades-pasadas");
      }

      listaActividadesHoy.append(tituloGrupo);
      grupoMostrado = grupoActividad;
    }

    const tarjetaActividad = document.createElement("button");
    tarjetaActividad.type = "button";
    tarjetaActividad.classList.add("tarjeta-actividad");

    if (actividadHaPasado) {
      tarjetaActividad.classList.add("tarjeta-actividad-pasada");
    }

    tarjetaActividad.addEventListener("click", function () {
      abrirFichaActividad(
        actividad.id,
        "inicio",
        true,
        convertirFechaAFormatoInput(new Date())
      );
    });

    const bloqueHora = document.createElement("div");
    bloqueHora.classList.add("bloque-hora-actividad");

    const horaActividad = document.createElement("time");
    horaActividad.classList.add("hora-actividad");
    horaActividad.dateTime = actividad.hora;
    horaActividad.textContent = actividad.hora;

    const nombrePersonaActividad = document.createElement("span");
    nombrePersonaActividad.classList.add("nombre-persona-actividad");
    nombrePersonaActividad.textContent = personaActividad.nombre;

    bloqueHora.append(horaActividad, nombrePersonaActividad);

    const separadorActividad = document.createElement("div");
    separadorActividad.classList.add("separador-actividad");

    const contenedorIconoActividad = document.createElement("div");
    contenedorIconoActividad.classList.add("icono-actividad");
    contenedorIconoActividad.style.backgroundColor = personaActividad.color;

    const iconoActividad = document.createElement("img");
    iconoActividad.src = rutasIconosActividades[actividad.actividad];
    iconoActividad.alt = "";

    contenedorIconoActividad.append(iconoActividad);

    const informacionActividad = document.createElement("div");
    informacionActividad.classList.add("informacion-actividad");

    const tituloActividad = document.createElement("h3");
    tituloActividad.textContent = obtenerNombreActividad(actividad);

    informacionActividad.append(tituloActividad);

    if (actividad.recordatorio !== "") {
      const recordatorioActividad = document.createElement("p");
      recordatorioActividad.textContent = actividad.recordatorio;
      informacionActividad.append(recordatorioActividad);
    }

    tarjetaActividad.append(
      bloqueHora,
      separadorActividad,
      contenedorIconoActividad,
      informacionActividad
    );

    listaActividadesHoy.append(tarjetaActividad);
  }
}

function eliminarActividadSeleccionada() {
  const indiceActividad = actividades.findIndex(function (actividad) {
    return actividad.id === idActividadSeleccionada;
  });

  if (indiceActividad === -1) {
    return;
  }

  const actividadSeleccionada = actividades[indiceActividad];
  const nombreActividad = obtenerNombreActividad(actividadSeleccionada);

  abrirConfirmacion(
    "Eliminar actividad",
    `¿Quieres eliminar ${nombreActividad}? Esta acción no se puede deshacer.`,
    async function () {
      const { data, error } = await clienteSupabase
        .from("actividades")
        .delete()
        .eq("id", actividadSeleccionada.id)
        .select("id");

      if (error) {
        console.log("No se pudo eliminar la actividad:", error);
        mostrarAviso("No se pudo eliminar", "Ha ocurrido un problema al eliminar la actividad. Inténtalo otra vez.");
        return;
      }

      if (data.length === 0) {
        console.log("Supabase no permitió eliminar la actividad. Revisa la política RLS de DELETE.");
        mostrarAviso("No se pudo eliminar", "La base de datos no ha permitido eliminar esta actividad.");
        return;
      }

      actividades.splice(indiceActividad, 1);

      renderizarActividadesDeHoy();
      mostrarMes();
      volverDesdeActividad();
    }
  );
}


botonVolverActividad.addEventListener("click", volverDesdeActividad);
botonEliminarActividad.addEventListener("click", eliminarActividadSeleccionada);

renderizarActividadesDeHoy();
setInterval(renderizarActividadesDeHoy, 60000);
