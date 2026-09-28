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

const fechaCalendario = new Date();
fechaCalendario.setDate(1);

function mostrarMes() {
  ocultarActividadesDelDia();

  const ano = fechaCalendario.getFullYear();
  const mes = fechaCalendario.getMonth();

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

      botonActividad.addEventListener("click", function () {
        pantallaCalendario.hidden = true;
        abrirFichaActividad(actividad.id, "calendario");
      });

      iconosDia.append(botonActividad);
    }

    if (actividadesDelDia.length > 2) {
      const numeroActividadesOcultas = actividadesDelDia.length - 2;
      const indicadorMasActividades = document.createElement("button");

      indicadorMasActividades.classList.add("mas-actividades-calendario");
      indicadorMasActividades.type = "button";
      indicadorMasActividades.textContent = `+${numeroActividadesOcultas}`;

      indicadorMasActividades.addEventListener("click", function () {
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

  tituloActividadesDia.textContent = fechaDia.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
    datosActividad.textContent = `${actividad.hora} · ${personaActividad.nombre}`;

    iconoActividad.append(imagenActividad);
    informacionActividad.append(nombreActividad, datosActividad);
    tarjetaActividad.append(iconoActividad, informacionActividad);

    tarjetaActividad.addEventListener("click", function () {
      seccionActividadesDia.hidden = true;
      pantallaCalendario.hidden = true;
      abrirFichaActividad(actividad.id, "calendario");
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
}

function volverInicioDesdeCalendario() {
  pantallaCalendario.hidden = true;
  pantallaInicio.hidden = false;
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

mostrarMes();
