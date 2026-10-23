// Elementos del calendario

const botonVerCalendario = document.querySelector("#boton-ver-calendario");
const pantallaCalendario = document.querySelector("#pantalla-calendario");
const botonVolverCalendario = document.querySelector("#boton-volver-calendario");
const tituloMesCalendario = document.querySelector("#mes-calendario");
const cuadriculaCalendario = document.querySelector("#cuadricula-calendario");
const botonMesAnterior = document.querySelector("#boton-mes-anterior");
const botonMesSiguiente = document.querySelector("#boton-mes-siguiente");
const seccionActividadesDia = document.querySelector("#actividades-dia-calendario");
const tituloActividadesDia = document.querySelector("#titulo-actividades-dia");
const listaActividadesDia = document.querySelector("#lista-actividades-dia");
const botonAnadirActividadDia = document.querySelector("#boton-anadir-actividad-dia");
const mensajeInicialCalendario = document.querySelector("#mensaje-inicial-calendario");

const mensajesDiaSinPlanes = [
  "Hoy no hay planes. Quizá sea un buen día para darte un capricho 💜",
  "Un día sin planes… suena a un ratito para ti 💜",
  "La agenda está tranquila. Hazle sitio a algo que te haga feliz 💜",
];

const fechaCalendario = new Date();
fechaCalendario.setDate(1);
let fechaSeleccionadaCalendario = null;

function seleccionarDiaCalendario(casillaDia, fechaDia) {
  const casillaSeleccionadaAnterior = cuadriculaCalendario.querySelector(
    ".dia-calendario-seleccionado"
  );

  if (casillaSeleccionadaAnterior) {
    casillaSeleccionadaAnterior.classList.remove("dia-calendario-seleccionado");
    casillaSeleccionadaAnterior.setAttribute("aria-pressed", "false");
  }

  fechaSeleccionadaCalendario = convertirFechaAFormatoInput(fechaDia);
  casillaDia.classList.add("dia-calendario-seleccionado");
  casillaDia.setAttribute("aria-pressed", "true");
}

function mostrarMes() {
  ocultarActividadesDelDia();

  const ano = fechaCalendario.getFullYear();
  const mes = fechaCalendario.getMonth();
  const hoy = new Date();

  const primerDiaDelMes = new Date(ano, mes, 1);
  const ultimoDiaDelMes = new Date(ano, mes + 1, 0);

  const cantidadDias = ultimoDiaDelMes.getDate();
  const espaciosIniciales = (primerDiaDelMes.getDay() + 6) % 7;

  tituloMesCalendario.textContent = fechaCalendario.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  cuadriculaCalendario.replaceChildren();

  for (let espacio = 0; espacio < espaciosIniciales; espacio++) {
    const casillaVacia = document.createElement("span");
    casillaVacia.classList.add("casilla-vacia-calendario");
    cuadriculaCalendario.append(casillaVacia);
  }

  for (let numeroDia = 1; numeroDia <= cantidadDias; numeroDia++) {
    const casillaDia = document.createElement("div");
    casillaDia.classList.add("dia-calendario");

    const numeroDiaCalendario = document.createElement("span");
    numeroDiaCalendario.classList.add("numero-dia-calendario");
    numeroDiaCalendario.textContent = numeroDia;

    const iconosDia = document.createElement("div");
    iconosDia.classList.add("iconos-dia-calendario");

    const fechaDia = new Date(ano, mes, numeroDia);

    casillaDia.setAttribute("role", "button");
    casillaDia.setAttribute("tabindex", "0");
    casillaDia.setAttribute("aria-label", fechaDia.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }));
    casillaDia.setAttribute("aria-pressed", "false");

    if (fechaSeleccionadaCalendario === convertirFechaAFormatoInput(fechaDia)) {
      casillaDia.classList.add("dia-calendario-seleccionado");
      casillaDia.setAttribute("aria-pressed", "true");
    }

    casillaDia.addEventListener("click", function () {
      seleccionarDiaCalendario(casillaDia, fechaDia);
      mostrarActividadesDelDia(fechaDia, actividadesDelDia);
    });

    casillaDia.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        seleccionarDiaCalendario(casillaDia, fechaDia);
        mostrarActividadesDelDia(fechaDia, actividadesDelDia);
      }
    });

    if (
      numeroDia === hoy.getDate() &&
      mes === hoy.getMonth() &&
      ano === hoy.getFullYear()
    ) {
      casillaDia.classList.add("dia-calendario-hoy");
      numeroDiaCalendario.setAttribute("aria-current", "date");
    }

    const actividadesDelDia = actividades.filter(function (actividad) {
      return actividadOcurreEnFecha(actividad, fechaDia);
    });

    const actividadesVisibles = actividadesDelDia.slice(0, 2);

    for (const actividad of actividadesVisibles) {
      const personaActividad = personas.find(function (persona) {
        return persona.id === actividad.personaId;
      });

      if (!personaActividad) {
        continue;
      }

      const botonActividad = document.createElement("button");
      botonActividad.classList.add("icono-actividad-calendario");
      botonActividad.type = "button";
      botonActividad.style.backgroundColor = personaActividad.color;
      botonActividad.setAttribute(
        "aria-label",
        `${obtenerNombreActividad(actividad)} de ${personaActividad.nombre}`
      );

      const imagenActividad = document.createElement("img");
      imagenActividad.src = rutasIconosActividades[actividad.actividad];
      imagenActividad.alt = "";

      botonActividad.append(imagenActividad);

      botonActividad.addEventListener("click", function (evento) {
        evento.stopPropagation();
        pantallaCalendario.hidden = true;
        abrirFichaActividad(
          actividad.id,
          "calendario",
          true,
          convertirFechaAFormatoInput(fechaDia)
        );
      });

      iconosDia.append(botonActividad);
    }

    if (actividadesDelDia.length > 2) {
      const numeroActividadesOcultas = actividadesDelDia.length - 2;
      const indicadorMasActividades = document.createElement("button");

      indicadorMasActividades.classList.add("mas-actividades-calendario");
      indicadorMasActividades.type = "button";
      indicadorMasActividades.textContent = `+${numeroActividadesOcultas}`;

      indicadorMasActividades.addEventListener("click", function (evento) {
        evento.stopPropagation();
        seleccionarDiaCalendario(casillaDia, fechaDia);
        mostrarActividadesDelDia(fechaDia, actividadesDelDia);
      });

      iconosDia.append(indicadorMasActividades);
    }

    casillaDia.append(numeroDiaCalendario, iconosDia);
    cuadriculaCalendario.append(casillaDia);
  }
}

function mostrarActividadesDelDia(fechaDia, actividadesDelDia) {
  listaActividadesDia.replaceChildren();
  mensajeInicialCalendario.hidden = true;

  tituloActividadesDia.textContent = fechaDia.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (actividadesDelDia.length === 0) {
    const mensajeDiaVacio = document.createElement("p");
    mensajeDiaVacio.classList.add("mensaje-dia-vacio");
    mensajeDiaVacio.textContent =
      mensajesDiaSinPlanes[Math.floor(Math.random() * mensajesDiaSinPlanes.length)];
    listaActividadesDia.append(mensajeDiaVacio);
  }

  for (const actividad of actividadesDelDia) {
    const personaActividad = personas.find(function (persona) {
      return persona.id === actividad.personaId;
    });

    if (!personaActividad) {
      continue;
    }

    const tarjetaActividad = document.createElement("button");
    tarjetaActividad.classList.add("tarjeta-actividad-dia");
    tarjetaActividad.type = "button";

    const iconoActividad = document.createElement("div");
    iconoActividad.classList.add("icono-actividad-dia");
    iconoActividad.style.backgroundColor = personaActividad.color;

    const imagenActividad = document.createElement("img");
    imagenActividad.src = rutasIconosActividades[actividad.actividad];
    imagenActividad.alt = "";

    const informacionActividad = document.createElement("div");

    const nombreActividad = document.createElement("p");
    nombreActividad.classList.add("nombre-actividad-dia");
    nombreActividad.textContent = obtenerNombreActividad(actividad);

    const datosActividad = document.createElement("p");
    datosActividad.classList.add("datos-actividad-dia");
    const horarioActividad = actividad.horaFin
      ? `${actividad.hora}–${actividad.horaFin}`
      : actividad.hora;
    datosActividad.textContent = `${horarioActividad} · ${personaActividad.nombre}`;

    iconoActividad.append(imagenActividad);
    informacionActividad.append(nombreActividad, datosActividad);
    tarjetaActividad.append(iconoActividad, informacionActividad);

    tarjetaActividad.addEventListener("click", function () {
      seccionActividadesDia.hidden = true;
      pantallaCalendario.hidden = true;
      abrirFichaActividad(
        actividad.id,
        "calendario",
        true,
        convertirFechaAFormatoInput(fechaDia)
      );
    });

    listaActividadesDia.append(tarjetaActividad);
  }

  seccionActividadesDia.hidden = false;
  seccionActividadesDia.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function ocultarActividadesDelDia() {
  seccionActividadesDia.hidden = true;
  listaActividadesDia.replaceChildren();
}

function abrirCalendario() {
  pantallaInicio.hidden = true;
  pantallaCalendario.hidden = false;
  registrarPantalla("calendario");
}

function volverInicioDesdeCalendario() {
  history.back();
}

function mostrarMesAnterior() {
  fechaCalendario.setMonth(fechaCalendario.getMonth() - 1);
  mostrarMes();
}

function mostrarMesSiguiente() {
  fechaCalendario.setMonth(fechaCalendario.getMonth() + 1);
  mostrarMes();
}

botonVerCalendario.addEventListener("click", abrirCalendario);
botonVolverCalendario.addEventListener("click", volverInicioDesdeCalendario);
botonMesAnterior.addEventListener("click", mostrarMesAnterior);
botonMesSiguiente.addEventListener("click", mostrarMesSiguiente);
botonAnadirActividadDia.addEventListener("click", function () {
  if (fechaSeleccionadaCalendario === null) {
    return;
  }

  abrirEmergenteNuevaActividad(null, fechaSeleccionadaCalendario);
});

mostrarMes();
