
// Estos datos se cargan desde Supabase después de iniciar sesión.
const personas = [];

let idPersonaSeleccionada = null;
let idPersonaEnEdicion = null;

const rutasIconos = {
  mujer: "Branding/iconos/SVG/mama.svg",
  nino: "Branding/iconos/SVG/ni%C3%B1o.svg",
  bebe: "Branding/iconos/SVG/bebe.svg",
  hombre: "Branding/iconos/SVG/papa.svg",
  nina: "Branding/iconos/SVG/ni%C3%B1a.svg",
  abuela: "Branding/iconos/SVG/abuela.svg",
  abuelo: "Branding/iconos/SVG/abuelo.svg",
  beba: "Branding/iconos/SVG/beba.svg",
};
// Devolver fecha actual //

const fechaHoy = document.querySelector("#fecha-hoy");
const tituloBienvenida = document.querySelector("#bienvenida-titulo");
const mensajeBienvenida = document.querySelector("#bienvenida-mensaje");


const ahora = new Date();
const fechaBonita = ahora.toLocaleDateString("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});


fechaHoy.textContent = fechaBonita;

function mostrarBienvenidaDelDia() {
  const hora = ahora.getHours();
  let bienvenidas;

  if (hora < 13) {
    bienvenidas = [
      { titulo: "Buenos días.", mensaje: "Vamos a por el día, a tu ritmo." },
      { titulo: "Hola, familia.", mensaje: "Hoy también, paso a paso." },
      { titulo: "Empezamos con calma.", mensaje: "Aquí tienes lo importante de hoy." },
      { titulo: "Un día cada vez.", mensaje: "Echa un vistazo y sigue a tu ritmo." },
    ];
  } else if (hora < 20) {
    bienvenidas = [
      { titulo: "Buenas tardes.", mensaje: "Seguimos, sin prisa y con lo importante a mano." },
      { titulo: "Hola de nuevo.", mensaje: "Así va lo que queda del día." },
      { titulo: "Seguimos a vuestro ritmo.", mensaje: "Un vistazo y a continuar." },
      { titulo: "La tarde, un poco más clara.", mensaje: "Aquí tienes los planes que quedan." },
    ];
  } else {
    bienvenidas = [
      { titulo: "Buenas noches.", mensaje: "Un último vistazo y a descansar." },
      { titulo: "El día va terminando.", mensaje: "Lo de mañana puede esperar un poquito." },
      { titulo: "Hora de bajar el ritmo.", mensaje: "Aquí sigue todo, cuando lo necesites." },
      { titulo: "Por hoy, poquito más.", mensaje: "Revisa lo necesario y deja descansar la cabeza." },
    ];
  }

  const inicioAno = new Date(ahora.getFullYear(), 0, 0);
  const numeroDiaAno = Math.floor((ahora - inicioAno) / 86400000);
  const bienvenidaElegida = bienvenidas[numeroDiaAno % bienvenidas.length];

  tituloBienvenida.textContent = bienvenidaElegida.titulo;
  mensajeBienvenida.textContent = bienvenidaElegida.mensaje;
}

mostrarBienvenidaDelDia();

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
const mensajeErrorPersona = document.querySelector("#mensaje-error-persona");
const emergenteConfirmacion = document.querySelector("#emergente-confirmacion");
const tituloConfirmacion = document.querySelector("#titulo-confirmacion");
const mensajeConfirmacionEmergente = document.querySelector("#mensaje-confirmacion");
const botonCancelarConfirmacion = document.querySelector("#boton-cancelar-confirmacion");
const botonAceptarConfirmacion = document.querySelector("#boton-aceptar-confirmacion");

let accionPendienteConfirmacion = null;

function abrirConfirmacion(titulo, mensaje, accion) {
  tituloConfirmacion.textContent = titulo;
  mensajeConfirmacionEmergente.textContent = mensaje;
  botonCancelarConfirmacion.hidden = false;
  botonAceptarConfirmacion.textContent = "Eliminar";
  accionPendienteConfirmacion = accion;
  emergenteConfirmacion.showModal();
}

function mostrarAviso(titulo, mensaje) {
  tituloConfirmacion.textContent = titulo;
  mensajeConfirmacionEmergente.textContent = mensaje;
  botonCancelarConfirmacion.hidden = true;
  botonAceptarConfirmacion.textContent = "Entendido";
  accionPendienteConfirmacion = null;
  emergenteConfirmacion.showModal();
}

function cancelarConfirmacion() {
  accionPendienteConfirmacion = null;
  emergenteConfirmacion.close();
}

function aceptarConfirmacion() {
  const accionConfirmada = accionPendienteConfirmacion;

  accionPendienteConfirmacion = null;
  emergenteConfirmacion.close();

  if (accionConfirmada) {
    accionConfirmada();
  }
}

function abrirEmergenteNuevaPersona() {
  idPersonaEnEdicion = null;

  formularioNuevaPersona.reset();
  mensajeErrorPersona.hidden = true;

  tituloEmergentePersona.textContent = "Añade una nueva persona";

  botonGuardarPersona.textContent = "Guardar";

  emergenteNuevaPersona.showModal();
}

function cerrarEmergenteNuevaPersona() {
  emergenteNuevaPersona.close();
}

function abrirFichaPersona(idPersona, guardarEnHistorial = true) {
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
    });

  if (proximasActividades.length === 0) {
    const mensajeSinActividades = document.createElement("p");
    mensajeSinActividades.classList.add("mensaje-sin-actividades-persona");
    mensajeSinActividades.textContent = "Todavía no hay próximas actividades.";

    listaProximasActividades.append(mensajeSinActividades);
  } else {
    let indiceProximaActividad = 0;

    for (const proximaActividad of proximasActividades) {
      const tarjetaProximaActividad = document.createElement("button");
      tarjetaProximaActividad.type = "button";
      tarjetaProximaActividad.classList.add("tarjeta-proxima-actividad");

      if (indiceProximaActividad >= 3) {
        tarjetaProximaActividad.classList.add("actividad-proxima-adicional");
        tarjetaProximaActividad.hidden = true;
      }

      tarjetaProximaActividad.addEventListener("click", function () {
        abrirFichaActividad(
          proximaActividad.actividad.id,
          "persona",
          true,
          convertirFechaAFormatoInput(proximaActividad.proximaFecha)
        );
      });

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
      nombreProximaActividad.textContent = obtenerNombreActividad(
        proximaActividad.actividad
      );

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
      indiceProximaActividad++;
    }

    if (proximasActividades.length > 3) {
      const botonVerTodas = document.createElement("button");
      botonVerTodas.type = "button";
      botonVerTodas.classList.add("boton-ver-todas-actividades");
      botonVerTodas.textContent = `Ver todas (${proximasActividades.length})`;
      botonVerTodas.setAttribute("aria-expanded", "false");

      let mostrandoTodas = false;

      botonVerTodas.addEventListener("click", function () {
        mostrandoTodas = !mostrandoTodas;

        const tarjetasAdicionales =
          listaProximasActividades.querySelectorAll(
            ".actividad-proxima-adicional"
          );

        for (const tarjeta of tarjetasAdicionales) {
          tarjeta.hidden = !mostrandoTodas;
        }

        botonVerTodas.setAttribute(
          "aria-expanded",
          String(mostrandoTodas)
        );

        if (mostrandoTodas) {
          botonVerTodas.textContent = "Ver solo las próximas 3";
        } else {
          botonVerTodas.textContent =
            `Ver todas (${proximasActividades.length})`;
        }
      });

      listaProximasActividades.append(botonVerTodas);
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

  if (guardarEnHistorial) {
    registrarPantalla("persona", { idPersona: idPersona });
  }
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
  mensajeErrorPersona.hidden = true;

  emergenteNuevaPersona.showModal();
}

function volverInicio() {
  history.back();
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

  abrirConfirmacion("Eliminar persona", mensajeConfirmacion, async function () {
    const { data, error } = await clienteSupabase
      .from("personas")
      .delete()
      .eq("id", persona.id)
      .select("id");

    if (error) {
      console.log("No se pudo eliminar la persona:", error);
      registrarErrorApp("Eliminar persona", error);

      mostrarAviso("No se pudo eliminar", "Ha ocurrido un problema al eliminar a esta persona. Inténtalo otra vez.");
      return;
    }

    if (data.length === 0) {
      console.log("Supabase no permitió eliminar la persona. Revisa la política RLS de DELETE.");
      registrarErrorApp(
        "Eliminar persona",
        {
          message: "Supabase no permitió eliminar la persona.",
          code: "SIN_FILAS_AFECTADAS",
        }
      );
      mostrarAviso("No se pudo eliminar", "La base de datos no ha permitido eliminar a esta persona.");
      return;
    }

    personas.splice(indicePersona, 1);

    for (let indice = actividades.length - 1; indice >= 0; indice--) {
      if (actividades[indice].personaId === persona.id) {
        actividades.splice(indice, 1);
      }
    }

    renderizarPersonas();
    renderizarActividadesDeHoy();
    mostrarMes();

    volverInicio();

    idPersonaSeleccionada = null;
  });
}

// formulario de añadir nueva persona//

async function guardarNuevaPersona(evento) {
  evento.preventDefault();
  mensajeErrorPersona.hidden = true;

  const datosFormulario = new FormData(formularioNuevaPersona);
  const idDeLaPersonaEditada = idPersonaEnEdicion;

  const datosPersona = {
    nombre: datosFormulario.get("nombre"),
    color: datosFormulario.get("color"),
    icono: datosFormulario.get("icono"),
  };

  botonGuardarPersona.disabled = true;

  if (idPersonaEnEdicion !== null) {
    const personaExistente = personas.find(function (persona) {
      return persona.id === idPersonaEnEdicion;
    });

    if (!personaExistente) {
      botonGuardarPersona.disabled = false;
      return;
    }

    const { error } = await clienteSupabase
      .from("personas")
      .update({
        nombre: datosPersona.nombre,
        color: datosPersona.color,
        icono: datosPersona.icono,
      })
      .eq("id", personaExistente.id);

    if (error) {
      console.log("No se pudo editar la persona:", error);
      registrarErrorApp("Editar persona", error);
      mensajeErrorPersona.textContent = "No hemos podido guardar los cambios. Inténtalo otra vez.";
      mensajeErrorPersona.hidden = false;
      botonGuardarPersona.disabled = false;
      return;
    }

    personaExistente.nombre = datosPersona.nombre;
    personaExistente.color = datosPersona.color;
    personaExistente.icono = datosPersona.icono;
  } else {
    const { data, error } = await clienteSupabase
      .from("personas")
      .insert({
        familia_id: familiaActual.id,
        nombre: datosPersona.nombre,
        color: datosPersona.color,
        icono: datosPersona.icono,
      })
      .select("id, nombre, color, icono")
      .single();

    if (error) {
      console.log("No se pudo crear la persona:", error);
      registrarErrorApp("Crear persona", error);
      mensajeErrorPersona.textContent = "No hemos podido añadir a esta persona. Inténtalo otra vez.";
      mensajeErrorPersona.hidden = false;
      botonGuardarPersona.disabled = false;
      return;
    }

    const nuevaPersona = {
      id: data.id,
      nombre: datosPersona.nombre,
      color: datosPersona.color,
      icono: datosPersona.icono,
    };

    personas.push(nuevaPersona);
  }

  botonGuardarPersona.disabled = false;

  renderizarPersonas();
  mostrarMes();

  formularioNuevaPersona.reset();

  cerrarEmergenteNuevaPersona();

  idPersonaEnEdicion = null;

  if (idDeLaPersonaEditada !== null) {
    abrirFichaPersona(idDeLaPersonaEditada, false);
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

botonCancelarConfirmacion.addEventListener("click", cancelarConfirmacion);
botonAceptarConfirmacion.addEventListener("click", aceptarConfirmacion);

emergenteConfirmacion.addEventListener("cancel", function () {
  accionPendienteConfirmacion = null;
});

renderizarPersonas();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./service-worker.js", { updateViaCache: "none" })
      .then(function () {
        console.log("Service worker registrado correctamente.");
      })
      .catch(function (error) {
        console.log("No se pudo registrar el service worker:", error);
      });
  });
}
