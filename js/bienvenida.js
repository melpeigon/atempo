const formularioBienvenida = document.querySelector("#formulario-bienvenida");
const campoNombreVisible = document.querySelector("#nombre-visible");
const mensajeBienvenidaInicial = document.querySelector("#mensaje-bienvenida");
const botonContinuarBienvenida = document.querySelector("#boton-continuar-bienvenida");
const avisoVistaPreviaBienvenida = document.querySelector("#aviso-vista-previa-bienvenida");
const pasoPresentacionBienvenida = document.querySelector("#paso-presentacion");
const pasoPersonasBienvenida = document.querySelector("#paso-personas");
const pasoNotificacionesBienvenida = document.querySelector("#paso-notificaciones");
const pasoCompartirBienvenida = document.querySelector("#paso-compartir");
const pasoActividadBienvenida = document.querySelector("#paso-actividad");
const tituloPasoPersonas = document.querySelector("#titulo-bienvenida-personas");
const tituloPasoNotificaciones = document.querySelector("#titulo-bienvenida-notificaciones");
const tituloPasoCompartir = document.querySelector("#titulo-bienvenida-compartir");
const tituloPasoActividad = document.querySelector("#titulo-bienvenida-actividad");
const botonAnadirPersonasBienvenida = document.querySelector("#boton-anadir-personas");
const botonContinuarPersonasBienvenida = document.querySelector("#boton-continuar-personas");
const botonConfigurarNotificacionesBienvenida = document.querySelector("#boton-configurar-notificaciones-bienvenida");
const botonContinuarNotificacionesBienvenida = document.querySelector("#boton-continuar-notificaciones");
const botonCompartirAgendaBienvenida = document.querySelector("#boton-compartir-agenda-bienvenida");
const botonContinuarCompartirBienvenida = document.querySelector("#boton-continuar-compartir");
const botonAnadirActividadBienvenida = document.querySelector("#boton-anadir-actividad-bienvenida");
const botonFinalizarBienvenida = document.querySelector("#boton-finalizar-bienvenida");
const mensajePasoNotificaciones = document.querySelector("#mensaje-paso-notificaciones");
const mensajePasoCompartir = document.querySelector("#mensaje-paso-compartir");
const mensajePasoActividad = document.querySelector("#mensaje-paso-actividad");
const mensajePasoPersonas = document.querySelector("#mensaje-paso-personas");
const modoVistaPrevia = new URLSearchParams(window.location.search).get("preview") === "1";
const pasoSolicitado = new URLSearchParams(window.location.search).get("paso");

let usuarioBienvenida = null;

function mostrarErrorBienvenida(mensaje) {
  mensajeBienvenidaInicial.textContent = mensaje;
  mensajeBienvenidaInicial.hidden = false;
}

function limpiarErrorBienvenida() {
  mensajeBienvenidaInicial.textContent = "";
  mensajeBienvenidaInicial.hidden = true;
}

function mostrarPasoBienvenida(paso, agregarHistorial = true) {
  const nombre = campoNombreVisible.value.trim();

  pasoPresentacionBienvenida.hidden = paso !== "presentacion";
  pasoPersonasBienvenida.hidden = paso !== "personas";
  pasoNotificacionesBienvenida.hidden = paso !== "notificaciones";
  pasoCompartirBienvenida.hidden = paso !== "compartir";
  pasoActividadBienvenida.hidden = paso !== "actividad";

  tituloPasoPersonas.textContent = nombre
    ? `${nombre}, vamos a preparar tu agenda`
    : "Vamos a preparar tu agenda";
  tituloPasoNotificaciones.textContent = nombre
    ? `${nombre}, ¿activamos tus avisos?`
    : "¿Activamos tus avisos?";
  tituloPasoCompartir.textContent = nombre
    ? `${nombre}, Que los planes de los peques no recaigan solo en ti`
    : "Que los planes de los peques no recaigan solo en ti";
  tituloPasoActividad.textContent = nombre
    ? `${nombre}, ¿añadimos vuestro primer plan?`
    : "¿Añadimos vuestro primer plan?";

  if (!agregarHistorial) return;

  const parametros = new URLSearchParams(window.location.search);
  if (paso === "presentacion") {
    parametros.delete("paso");
  } else {
    parametros.set("paso", paso);
  }
  const consulta = parametros.toString();
  history.pushState(
    { pasoBienvenida: paso },
    "",
    `${window.location.pathname}${consulta ? `?${consulta}` : ""}`
  );
}

async function prepararBienvenida() {
  const { data, error } = await clienteSupabase.auth.getSession();
  usuarioBienvenida = data.session?.user || null;

  if (error || !usuarioBienvenida) {
    if (modoVistaPrevia) {
      activarVistaPrevia();
      mostrarPasoBienvenida(
        ["personas", "notificaciones", "compartir", "actividad"].includes(pasoSolicitado) ? pasoSolicitado : "presentacion",
        false
      );
      return;
    }
    window.location.replace(new URL("index.html", window.location.href).toString());
    return;
  }

  const metadatos = usuarioBienvenida.user_metadata || {};
  if (modoVistaPrevia) {
    activarVistaPrevia();
    campoNombreVisible.value = metadatos.nombre_visible || "";
    mostrarPasoBienvenida(
      ["personas", "notificaciones", "compartir", "actividad"].includes(pasoSolicitado) ? pasoSolicitado : "presentacion",
      false
    );
    return;
  }

  if (["personas", "notificaciones", "compartir", "actividad"].includes(pasoSolicitado) && metadatos.atempo_bienvenida_pendiente && !metadatos.atempo_bienvenida_completada) {
    campoNombreVisible.value = metadatos.nombre_visible || "";
    mostrarPasoBienvenida(pasoSolicitado, false);
    return;
  }

  if (!metadatos.atempo_bienvenida_pendiente || metadatos.atempo_bienvenida_completada) {
    if (modoVistaPrevia) {
      activarVistaPrevia();
      campoNombreVisible.value = metadatos.nombre_visible || "";
      return;
    }
    window.location.replace(new URL("index.html", window.location.href).toString());
    return;
  }

  campoNombreVisible.value = metadatos.nombre_visible || "";
  mostrarPasoBienvenida("presentacion", false);
  campoNombreVisible.focus();
}

function activarVistaPrevia() {
  avisoVistaPreviaBienvenida.hidden = false;
  campoNombreVisible.required = false;
}

async function finalizarBienvenida(nombreVisible = "") {
  limpiarErrorBienvenida();

  const nombreLimpio = nombreVisible.trim();
  if (!nombreLimpio) {
    mostrarErrorBienvenida("Escribe el nombre con el que quieres que te llame Atempo.");
    campoNombreVisible.focus();
    return;
  }
  if (nombreLimpio.length > 40) {
    mostrarErrorBienvenida("El nombre puede tener hasta 40 caracteres.");
    return;
  }

  botonContinuarBienvenida.disabled = true;
  botonContinuarBienvenida.textContent = "Guardando…";

  const datosUsuario = {
    atempo_bienvenida_pendiente: true,
    atempo_bienvenida_completada: false,
  };
  datosUsuario.nombre_visible = nombreLimpio;

  const { error } = await clienteSupabase.auth.updateUser({ data: datosUsuario });

  if (error) {
    console.error("No se pudo guardar la bienvenida:", error);
    botonContinuarBienvenida.disabled = false;
    botonContinuarBienvenida.textContent = "Continuar";
    mostrarErrorBienvenida("No hemos podido guardar este paso. Comprueba la conexión e inténtalo de nuevo.");
    return;
  }

  mostrarPasoBienvenida("personas");
}

formularioBienvenida.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (modoVistaPrevia) {
    mostrarErrorBienvenida("En la bienvenida real, este nombre se guardará en tu cuenta.");
    return;
  }
  if (!formularioBienvenida.reportValidity()) return;
  await finalizarBienvenida(campoNombreVisible.value);
});

botonAnadirPersonasBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoPersonas.textContent = "En la bienvenida real, se abrirá tu agenda con el formulario para añadir personas.";
    mensajePasoPersonas.hidden = false;
    return;
  }

  window.location.href = new URL("index.html?configurar=personas", window.location.href).toString();
});

botonContinuarPersonasBienvenida.addEventListener("click", function () {
  mostrarPasoBienvenida("notificaciones");
});

botonContinuarNotificacionesBienvenida.addEventListener("click", function () {
  mostrarPasoBienvenida("compartir");
});

botonConfigurarNotificacionesBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoNotificaciones.textContent = "En la bienvenida real, se abrirán las preferencias de avisos de Atempo.";
    mensajePasoNotificaciones.hidden = false;
    return;
  }

  window.location.href = new URL("index.html?configurar=notificaciones", window.location.href).toString();
});

botonCompartirAgendaBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoCompartir.textContent = "En la bienvenida real, se abrirán las opciones para invitar a otro adulto.";
    mensajePasoCompartir.hidden = false;
    return;
  }

  window.location.href = new URL("index.html?configurar=compartir", window.location.href).toString();
});

botonContinuarCompartirBienvenida.addEventListener("click", function () {
  mostrarPasoBienvenida("actividad");
});

botonAnadirActividadBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoActividad.textContent = "En la bienvenida real, se abrirá el formulario para añadir una actividad.";
    mensajePasoActividad.hidden = false;
    return;
  }

  window.location.href = new URL("index.html?configurar=actividad", window.location.href).toString();
});

botonFinalizarBienvenida.addEventListener("click", async function () {
  if (modoVistaPrevia) {
    mensajePasoActividad.textContent = "En la bienvenida real, este botón terminará la configuración y abrirá tu agenda.";
    mensajePasoActividad.hidden = false;
    return;
  }

  botonFinalizarBienvenida.disabled = true;
  botonFinalizarBienvenida.textContent = "Guardando…";
  const { error } = await clienteSupabase.auth.updateUser({
    data: {
      atempo_bienvenida_pendiente: false,
      atempo_bienvenida_completada: true,
    },
  });

  if (error) {
    console.error("No se pudo terminar la bienvenida:", error);
    botonFinalizarBienvenida.disabled = false;
    botonFinalizarBienvenida.textContent = "Terminar";
    mensajePasoActividad.textContent = "No hemos podido terminar la bienvenida. Comprueba la conexión e inténtalo de nuevo.";
    mensajePasoActividad.hidden = false;
    return;
  }

  window.location.replace(new URL("index.html", window.location.href).toString());
});

window.addEventListener("popstate", function () {
  const paso = new URLSearchParams(window.location.search).get("paso");
  mostrarPasoBienvenida(
    ["personas", "notificaciones", "compartir", "actividad"].includes(paso) ? paso : "presentacion",
    false
  );
});

prepararBienvenida();
