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
const botonesSaltarBienvenida = document.querySelectorAll(".boton-saltar-bienvenida");
const modoVistaPrevia = new URLSearchParams(window.location.search).get("preview") === "1";
const parametrosBienvenida = new URLSearchParams(window.location.search);
const modoRevision = parametrosBienvenida.get("revisar") === "1";
const pasoSolicitado = parametrosBienvenida.get("paso");

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

  tituloPasoPersonas.textContent = modoRevision
    ? nombre ? `${nombre}, revisa tus personas` : "Revisa tus personas"
    : nombre ? `${nombre}, vamos a preparar tu agenda` : "Vamos a preparar tu agenda";
  tituloPasoNotificaciones.textContent = modoRevision
    ? nombre ? `${nombre}, revisa tus avisos` : "Revisa tus avisos"
    : nombre ? `${nombre}, ¿activamos tus avisos?` : "¿Activamos tus avisos?";
  tituloPasoCompartir.textContent = nombre
    ? modoRevision ? `${nombre}, revisa lo que compartes` : `${nombre}, Que los planes de los peques no recaigan solo en ti`
    : modoRevision ? "Revisa lo que compartes" : "Que los planes de los peques no recaigan solo en ti";
  tituloPasoActividad.textContent = nombre
    ? `${nombre}, ${modoRevision ? "¿añadimos otro plan?" : "¿añadimos vuestro primer plan?"}`
    : modoRevision ? "¿Añadimos otro plan?" : "¿Añadimos vuestro primer plan?";

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

  if (modoRevision) {
    sessionStorage.setItem("atempo-bienvenida-revision", "1");
    campoNombreVisible.value = metadatos.nombre_visible || "";
    mostrarPasoBienvenida(
      ["personas", "notificaciones", "compartir", "actividad"].includes(pasoSolicitado) ? pasoSolicitado : "presentacion",
      false
    );
    if (!pasoSolicitado || pasoSolicitado === "presentacion") {
      document.querySelector("#titulo-bienvenida-inicial").textContent = "Hola de nuevo, soy Atempo 💜";
      formularioBienvenida.querySelector("label").textContent = "¿Quieres cambiar el nombre o apodo con el que te llamo?";
      botonContinuarBienvenida.textContent = "Guardar y continuar";
    }
    actualizarTextosRevision();
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

function actualizarTextosRevision() {
  if (!modoRevision) return;
  const nombre = campoNombreVisible.value.trim();
  tituloPasoPersonas.textContent = nombre ? `${nombre}, revisa tus personas` : "Revisa tus personas";
  tituloPasoNotificaciones.textContent = nombre ? `${nombre}, revisa tus avisos` : "Revisa tus avisos";
  tituloPasoCompartir.textContent = nombre ? `${nombre}, revisa lo que compartes` : "Revisa lo que compartes";
  tituloPasoActividad.textContent = nombre ? `${nombre}, ¿añadimos otro plan?` : "¿Añadimos otro plan?";
  document.querySelector("#paso-personas .intro-bienvenida").textContent =
    "Puedes añadir o revisar las personas cuyos planes quieres tener a mano.";
  botonAnadirPersonasBienvenida.textContent = "Revisar personas";
  document.querySelector("#paso-notificaciones .intro-bienvenida").textContent =
    "Revisa los avisos de tus planes y el resumen diario. Se configuran en este dispositivo.";
  document.querySelector("#paso-compartir .intro-bienvenida").textContent =
    "Si quieres, invita a otro adulto para tener juntos a mano los planes de los niños.";
  document.querySelector("#paso-actividad .intro-bienvenida").textContent =
    "Puedes añadir otro plan ahora o volver a tu agenda cuando quieras.";
  botonAnadirActividadBienvenida.textContent = "Añadir un plan";
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

  const datosUsuario = modoRevision
    ? { nombre_visible: nombreLimpio }
    : {
        atempo_bienvenida_pendiente: true,
        atempo_bienvenida_completada: false,
        nombre_visible: nombreLimpio,
      };

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

async function saltarBienvenida(boton) {
  if (modoVistaPrevia) {
    avisoVistaPreviaBienvenida.textContent = "En la bienvenida real, Saltar guardará esta elección y abrirá tu agenda.";
    avisoVistaPreviaBienvenida.hidden = false;
    return;
  }

  if (modoRevision) {
    sessionStorage.removeItem("atempo-bienvenida-revision");
    sessionStorage.removeItem("atempo-bienvenida-regreso");
    window.location.replace(new URL("index.html", window.location.href).toString());
    return;
  }

  boton.disabled = true;
  boton.textContent = "Abriendo tu agenda…";
  const { error } = await clienteSupabase.auth.updateUser({
    data: {
      atempo_bienvenida_pendiente: false,
      atempo_bienvenida_completada: true,
    },
  });

  if (error) {
    console.error("No se pudo saltar la bienvenida:", error);
    boton.disabled = false;
    boton.textContent = "Saltar";
    const pasoVisible = document.querySelector(".paso-bienvenida:not([hidden])");
    const mensaje = pasoVisible?.querySelector(".mensaje-bienvenida");
    if (mensaje) {
      mensaje.textContent = "No hemos podido abrir tu agenda. Comprueba la conexión e inténtalo de nuevo.";
      mensaje.hidden = false;
    }
    return;
  }

  window.location.replace(new URL("index.html", window.location.href).toString());
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

botonesSaltarBienvenida.forEach(function (boton) {
  boton.addEventListener("click", function () {
    saltarBienvenida(boton);
  });
});

botonAnadirPersonasBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoPersonas.textContent = "En la bienvenida real, se abrirá tu agenda con el formulario para añadir personas.";
    mensajePasoPersonas.hidden = false;
    return;
  }

  irAConfigurar("personas");
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

  irAConfigurar("notificaciones");
});

botonCompartirAgendaBienvenida.addEventListener("click", function () {
  if (modoVistaPrevia) {
    mensajePasoCompartir.textContent = "En la bienvenida real, se abrirán las opciones para invitar a otro adulto.";
    mensajePasoCompartir.hidden = false;
    return;
  }

  if (modoRevision) sessionStorage.setItem("atempo-bienvenida-regreso", "compartir");
  const destinoCompartir = new URL("invitaciones.html?desde=bienvenida&paso=compartir", window.location.href);
  if (modoRevision) destinoCompartir.searchParams.set("revisar", "1");
  window.location.href = destinoCompartir.toString();
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

  irAConfigurar("actividad");
});

function irAConfigurar(funcion) {
  if (modoRevision) sessionStorage.setItem("atempo-bienvenida-revision", "1");
  const destino = new URL(`index.html?configurar=${encodeURIComponent(funcion)}`, window.location.href);
  if (modoRevision) destino.searchParams.set("revisar", "1");
  window.location.href = destino.toString();
}

botonFinalizarBienvenida.addEventListener("click", async function () {
  if (modoVistaPrevia) {
    mensajePasoActividad.textContent = "En la bienvenida real, este botón terminará la configuración y abrirá tu agenda.";
    mensajePasoActividad.hidden = false;
    return;
  }

  if (modoRevision) {
    sessionStorage.removeItem("atempo-bienvenida-revision");
    sessionStorage.removeItem("atempo-bienvenida-regreso");
    window.location.replace(new URL("index.html", window.location.href).toString());
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
