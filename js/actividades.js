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
};

const actividadesGuardadas = localStorage.getItem("actividades");

const actividades = actividadesGuardadas
  ? JSON.parse(actividadesGuardadas)
  : [];

let idActividadSeleccionada = null;

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

function obtenerActividadesDeHoy() {
  const fechaHoyFormatoInput = `${anoActual}-${mesActual}-${diaActual}`;
  const nombreDiaHoy = nombresDiasSemana[fechaActual.getDay()];
  const numeroDiaHoy = fechaActual.getDate();

  const actividadesDeHoy = actividades.filter(function (actividad) {
    if (actividad.fecha > fechaHoyFormatoInput) {
      return false;
    }

    if (actividad.recurrencia === "puntual") {
      return actividad.fecha === fechaHoyFormatoInput;
    }

    if (actividad.recurrencia === "semanal") {
      return actividad.dias.includes(nombreDiaHoy);
    }

    if (actividad.recurrencia === "mensual") {
      const numeroDiaActividad = Number(actividad.fecha.split("-")[2]);
      const ultimoDiaMesActual = obtenerUltimoDiaDelMes(
        fechaActual.getFullYear(),
        fechaActual.getMonth() + 1
      );
      const diaActividadEsteMes = Math.min(numeroDiaActividad, ultimoDiaMesActual);

      return diaActividadEsteMes === numeroDiaHoy;
    }

    if (actividad.recurrencia === "anual") {
      const partesFechaActividad = actividad.fecha.split("-");
      const mesActividad = Number(partesFechaActividad[1]);
      const numeroDiaActividad = Number(partesFechaActividad[2]);
      const mesActualNumero = fechaActual.getMonth() + 1;

      if (mesActividad !== mesActualNumero) {
        return false;
      }

      const ultimoDiaMesActual = obtenerUltimoDiaDelMes(
        fechaActual.getFullYear(),
        mesActualNumero
      );
      const diaActividadEsteAno = Math.min(numeroDiaActividad, ultimoDiaMesActual);

      return diaActividadEsteAno === numeroDiaHoy;
    }

    return false;
  });

  return actividadesDeHoy;
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

function abrirFichaActividad(idActividad) {
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

  idActividadSeleccionada = idActividad;
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
  nombreFichaActividad.textContent = nombresActividades[actividadSeleccionada.actividad];

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

  const fechaFichaActividad = crearDatoFichaActividad(
    "Branding/iconos/SVG/dia.svg",
    formatearFechaActividad(actividadSeleccionada.fecha),
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

  horarioFichaActividad.append(
    fechaFichaActividad,
    horaFichaActividad,
    recurrenciaFichaActividad
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
  fichaActividad.hidden = false;
}

function volverInicioDesdeActividad() {
  fichaActividad.hidden = true;
  pantallaInicio.hidden = false;
  idActividadSeleccionada = null;
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
    return primeraActividad.hora.localeCompare(segundaActividad.hora);
  });

  for (const actividad of actividadesDeHoy) {
    const personaActividad = personas.find(function (persona) {
      return persona.id === actividad.personaId;
    });

    if (!personaActividad) {
      continue;
    }

    const tarjetaActividad = document.createElement("button");
    tarjetaActividad.type = "button";
    tarjetaActividad.classList.add("tarjeta-actividad");

    tarjetaActividad.addEventListener("click", function () {
      abrirFichaActividad(actividad.id);
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
    tituloActividad.textContent = nombresActividades[actividad.actividad];

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

  const confirmarEliminacion = confirm(
    `¿Quieres eliminar ${nombresActividades[actividadSeleccionada.actividad]}?`
  );

  if (!confirmarEliminacion) {
    return;
  }

  actividades.splice(indiceActividad, 1);

  localStorage.setItem("actividades", JSON.stringify(actividades));

  renderizarActividadesDeHoy();
  volverInicioDesdeActividad();
}


botonVolverActividad.addEventListener("click", volverInicioDesdeActividad);
botonEliminarActividad.addEventListener("click", eliminarActividadSeleccionada);

renderizarActividadesDeHoy();
