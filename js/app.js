
const personasGuardadas = localStorage.getItem("personas");

const personas = personasGuardadas
  ? JSON.parse(personasGuardadas)
  : [];

for (const persona of personas) {
  if (!persona.id) {
    persona.id = crypto.randomUUID();
  }
}

localStorage.setItem("personas", JSON.stringify(personas));

let idPersonaSeleccionada = null;
let idPersonaEnEdicion = null;

const rutasIconos = {
  mujer: "Branding/iconos/SVG/mama.svg",
  nino: "Branding/iconos/SVG/ni%C3%B1o.svg",
  bebe: "Branding/iconos/SVG/bebe.svg",
  hombre: "Branding/iconos/SVG/papa.svg",
};
// Devolver fecha actual //

const fechaHoy = document.querySelector("#fecha-hoy");


const ahora = new Date();
const fechaBonita = ahora.toLocaleDateString("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});


fechaHoy.textContent = fechaBonita;

// boton añadir personas //

const botonPersona = document.querySelector("#boton-primera-persona");
const emergenteNuevaPersona = document.querySelector("#emergente-nueva-persona");
const botonCerrarEmergente = document.querySelector("#boton-cerrar-emergente");
const formularioNuevaPersona = document.querySelector("#formulario-nueva-persona");
const botonAnadirOtraPersona = document.querySelector("#boton-anadir-otra-persona");

const estadoSinPersonas = document.querySelector("#estado-sin-personas");
const listaPersonas = document.querySelector("#lista-personas");


const pantallaInicio = document.querySelector("#pantalla-inicio");
const fichaPersona = document.querySelector("#ficha-persona");
const contenidoFichaPersona = document.querySelector("#contenido-ficha-persona");
const botonVolverInicio = document.querySelector("#boton-volver-inicio");
const botonEliminarPersona = document.querySelector("#boton-eliminar-persona");
const botonEditarPersona = document.querySelector("#boton-editar-persona");
const tituloEmergentePersona = document.querySelector("#titulo-emergente-nueva-persona");
const botonGuardarPersona = document.querySelector("#boton-guardar-persona");

function abrirEmergenteNuevaPersona() {
  idPersonaEnEdicion = null;

  formularioNuevaPersona.reset();

  tituloEmergentePersona.textContent = "Añade una nueva persona";

  botonGuardarPersona.textContent = "Guardar";

  emergenteNuevaPersona.showModal();
}

function cerrarEmergenteNuevaPersona() {
  emergenteNuevaPersona.close();
}

function abrirFichaPersona(idPersona) {
  const personaSeleccionada = personas.find(function (persona) {
    return persona.id === idPersona;
  });

  if (!personaSeleccionada) {
    return;
  }

  contenidoFichaPersona.replaceChildren();

  const avatarFichaPersona = document.createElement("div");
  avatarFichaPersona.classList.add("avatar-ficha-persona");
  avatarFichaPersona.style.backgroundColor = personaSeleccionada.color;

  const iconoFichaPersona = document.createElement("img");
  iconoFichaPersona.src = rutasIconos[personaSeleccionada.icono];
  iconoFichaPersona.alt = "";

  const nombreFichaPersona = document.createElement("h2");
  nombreFichaPersona.textContent = personaSeleccionada.nombre;

  const seccionProximasActividades = document.createElement("section");
  seccionProximasActividades.classList.add("proximas-actividades-persona");

  const tituloProximasActividades = document.createElement("h3");
  tituloProximasActividades.textContent = "Próximas actividades";

  const listaProximasActividades = document.createElement("div");
  listaProximasActividades.classList.add("lista-proximas-actividades");

  const proximasActividades = actividades
    .filter(function (actividad) {
      return actividad.personaId === personaSeleccionada.id;
    })
    .map(function (actividad) {
      return {
        actividad: actividad,
        proximaFecha: obtenerProximaFechaActividad(actividad),
      };
    })
    .filter(function (proximaActividad) {
      return proximaActividad.proximaFecha !== null;
    })
    .sort(function (primeraActividad, segundaActividad) {
      const diferenciaFechas =
        primeraActividad.proximaFecha - segundaActividad.proximaFecha;

      if (diferenciaFechas !== 0) {
        return diferenciaFechas;
      }

      return primeraActividad.actividad.hora.localeCompare(
        segundaActividad.actividad.hora
      );
    })
    .slice(0, 3);

  if (proximasActividades.length === 0) {
    const mensajeSinActividades = document.createElement("p");
    mensajeSinActividades.classList.add("mensaje-sin-actividades-persona");
    mensajeSinActividades.textContent = "Todavía no hay próximas actividades.";

    listaProximasActividades.append(mensajeSinActividades);
  } else {
    for (const proximaActividad of proximasActividades) {
      const tarjetaProximaActividad = document.createElement("article");
      tarjetaProximaActividad.classList.add("tarjeta-proxima-actividad");
      tarjetaProximaActividad.style.setProperty(
        "--color-persona",
        personaSeleccionada.color
      );

      const iconoProximaActividad = document.createElement("div");
      iconoProximaActividad.classList.add("icono-proxima-actividad");

      const imagenProximaActividad = document.createElement("img");
      imagenProximaActividad.src =
        rutasIconosActividades[proximaActividad.actividad.actividad];
      imagenProximaActividad.alt = "";

      const informacionProximaActividad = document.createElement("div");
      informacionProximaActividad.classList.add("informacion-proxima-actividad");

      const nombreProximaActividad = document.createElement("p");
      nombreProximaActividad.classList.add("nombre-proxima-actividad");
      nombreProximaActividad.textContent =
        nombresActividades[proximaActividad.actividad.actividad];

      const fechaProximaActividad = document.createElement("p");
      fechaProximaActividad.classList.add("fecha-proxima-actividad");
      fechaProximaActividad.textContent =
        `${proximaActividad.proximaFecha.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })} · ${proximaActividad.actividad.hora}`;

      iconoProximaActividad.append(imagenProximaActividad);
      informacionProximaActividad.append(
        nombreProximaActividad,
        fechaProximaActividad
      );
      tarjetaProximaActividad.append(
        iconoProximaActividad,
        informacionProximaActividad
      );
      listaProximasActividades.append(tarjetaProximaActividad);
    }
  }

  seccionProximasActividades.append(
    tituloProximasActividades,
    listaProximasActividades
  );

  idPersonaSeleccionada = idPersona;

  avatarFichaPersona.append(iconoFichaPersona);

  contenidoFichaPersona.append(
    avatarFichaPersona,
    nombreFichaPersona,
    seccionProximasActividades
  );

  pantallaInicio.hidden = true;
  fichaPersona.hidden = false;
}

function editarPersonaSeleccionada() {
  const personaSeleccionada = personas.find(function (persona) {
    return persona.id === idPersonaSeleccionada;
  });

  if (!personaSeleccionada) {
    return;
  }

  idPersonaEnEdicion = personaSeleccionada.id;

  formularioNuevaPersona.elements.nombre.value =
    personaSeleccionada.nombre;

  formularioNuevaPersona.elements.color.value =
    personaSeleccionada.color;

  formularioNuevaPersona.elements.icono.value =
    personaSeleccionada.icono;

  tituloEmergentePersona.textContent = "Editar persona";

  botonGuardarPersona.textContent = "Guardar cambios";

  emergenteNuevaPersona.showModal();
}

function volverInicio() {
  fichaPersona.hidden = true;

  pantallaInicio.hidden = false;
}

function eliminarPersonaSeleccionada() {
  const indicePersona = personas.findIndex(function (persona) {
    return persona.id === idPersonaSeleccionada;
  });

  if (indicePersona === -1) {
    return;
  }

  const persona = personas[indicePersona];
  const numeroActividadesPersona = actividades.filter(function (actividad) {
    return actividad.personaId === persona.id;
  }).length;

  let mensajeConfirmacion = `¿Quieres eliminar a ${persona.nombre}?`;

  if (numeroActividadesPersona === 1) {
    mensajeConfirmacion += " También se eliminará su actividad.";
  } else if (numeroActividadesPersona > 1) {
    mensajeConfirmacion += ` También se eliminarán sus ${numeroActividadesPersona} actividades.`;
  }

  const confirmarEliminacion = confirm(mensajeConfirmacion);

  if (!confirmarEliminacion) {
    return;
  }

  personas.splice(indicePersona, 1);

  for (let indice = actividades.length - 1; indice >= 0; indice--) {
    if (actividades[indice].personaId === persona.id) {
      actividades.splice(indice, 1);
    }
  }

  localStorage.setItem("personas", JSON.stringify(personas));
  localStorage.setItem("actividades", JSON.stringify(actividades));

  renderizarPersonas();
  renderizarActividadesDeHoy();

  volverInicio();

  idPersonaSeleccionada = null;
}

// formulario de añadir nueva persona//

function guardarNuevaPersona(evento) {
  evento.preventDefault();

  const datosFormulario = new FormData(formularioNuevaPersona);
  const idDeLaPersonaEditada = idPersonaEnEdicion;

  const datosPersona = {
    nombre: datosFormulario.get("nombre"),
    color: datosFormulario.get("color"),
    icono: datosFormulario.get("icono"),
  };

  if (idPersonaEnEdicion !== null) {
    const personaExistente = personas.find(function (persona) {
      return persona.id === idPersonaEnEdicion;
    });

    if (!personaExistente) {
      return;
    }

    personaExistente.nombre = datosPersona.nombre;
    personaExistente.color = datosPersona.color;
    personaExistente.icono = datosPersona.icono;
  } else {
    const nuevaPersona = {
      id: crypto.randomUUID(),
      nombre: datosPersona.nombre,
      color: datosPersona.color,
      icono: datosPersona.icono,
    };

    personas.push(nuevaPersona);
  }

  localStorage.setItem("personas", JSON.stringify(personas));

  renderizarPersonas();

  formularioNuevaPersona.reset();

  cerrarEmergenteNuevaPersona();

  idPersonaEnEdicion = null;

  if (idDeLaPersonaEditada !== null) {
    abrirFichaPersona(idDeLaPersonaEditada);
  }
}

function renderizarPersonas() {
  listaPersonas.replaceChildren();

  if (personas.length === 0) {
    estadoSinPersonas.hidden = false;
    botonAnadirOtraPersona.hidden = true;
  } else {
    estadoSinPersonas.hidden = true;
    botonAnadirOtraPersona.hidden = false;
  }

  for (const persona of personas) {
    const tarjetaPersona = document.createElement("button");
    tarjetaPersona.type = "button";

    tarjetaPersona.classList.add("tarjeta-persona");
    tarjetaPersona.dataset.id = persona.id;

    tarjetaPersona.addEventListener("click", function () {
      abrirFichaPersona(persona.id);
    });

    const avatarPersona = document.createElement("div");
    avatarPersona.classList.add("avatar-persona");
    avatarPersona.style.backgroundColor = persona.color;

    const iconoPersona = document.createElement("img");
    iconoPersona.src = rutasIconos[persona.icono];
    iconoPersona.alt = "";

    const nombrePersona = document.createElement("p");
    nombrePersona.textContent = persona.nombre;

    avatarPersona.append(iconoPersona);

    tarjetaPersona.append(avatarPersona, nombrePersona);


    listaPersonas.append(tarjetaPersona);
  }
}


botonPersona.addEventListener("click", abrirEmergenteNuevaPersona);
botonCerrarEmergente.addEventListener("click", cerrarEmergenteNuevaPersona);
formularioNuevaPersona.addEventListener("submit", guardarNuevaPersona);
botonAnadirOtraPersona.addEventListener("click", abrirEmergenteNuevaPersona);
botonVolverInicio.addEventListener("click", volverInicio);
botonEliminarPersona.addEventListener("click", eliminarPersonaSeleccionada);
botonEditarPersona.addEventListener("click", editarPersonaSeleccionada);

renderizarPersonas();
