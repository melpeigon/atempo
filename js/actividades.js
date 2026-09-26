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
      return numeroDiaActividad === numeroDiaHoy;
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

  const iconoFichaActividad = document.createElement("div");
  iconoFichaActividad.classList.add("icono-ficha-actividad");
  iconoFichaActividad.style.backgroundColor = personaActividad.color;

  const imagenFichaActividad = document.createElement("img");
  imagenFichaActividad.src = rutasIconosActividades[actividadSeleccionada.actividad];
  imagenFichaActividad.alt = "";

  iconoFichaActividad.append(imagenFichaActividad);

  const nombreFichaActividad = document.createElement("h2");
  nombreFichaActividad.textContent = nombresActividades[actividadSeleccionada.actividad];

  const personaFichaActividad = document.createElement("p");
  personaFichaActividad.classList.add("persona-ficha-actividad");
  personaFichaActividad.textContent = personaActividad.nombre;

  const fechaFichaActividad = document.createElement("p");
  fechaFichaActividad.textContent =
  `Fecha de inicio: ${formatearFechaActividad(actividadSeleccionada.fecha)}`;

  const horaFichaActividad = document.createElement("p");
  horaFichaActividad.textContent = `Hora: ${actividadSeleccionada.hora}`;

  const recurrenciaFichaActividad = document.createElement("p");

  if (actividadSeleccionada.recurrencia === "semanal") {
    recurrenciaFichaActividad.textContent =
      `Recurrencia: semanal — ${actividadSeleccionada.dias.join(", ")}`;
  } else {
    recurrenciaFichaActividad.textContent =
      `Recurrencia: ${actividadSeleccionada.recurrencia}`;
  }

  contenidoFichaActividad.append(
    iconoFichaActividad,
    nombreFichaActividad,
    personaFichaActividad,
    fechaFichaActividad,
    horaFichaActividad,
    recurrenciaFichaActividad
  );

  if (actividadSeleccionada.recordatorio !== "") {
    const recordatorioFichaActividad = document.createElement("p");
    recordatorioFichaActividad.classList.add("recordatorio-ficha-actividad");
    recordatorioFichaActividad.textContent =
      `Recordatorio: ${actividadSeleccionada.recordatorio}`;

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
