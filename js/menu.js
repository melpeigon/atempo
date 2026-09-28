// Elementos del menú

const botonAbrirMenu = document.querySelector("#boton-abrir-menu");
const emergenteMenu = document.querySelector("#emergente-menu");
const botonCerrarMenu = document.querySelector("#boton-cerrar-menu");
const botonMenuNotificaciones = document.querySelector("#boton-menu-notificaciones");
const botonMenuGuia = document.querySelector("#boton-menu-guia");
const emergenteNotificaciones = document.querySelector("#emergente-notificaciones");
const formularioNotificaciones = document.querySelector("#formulario-notificaciones");
const selectorModoNotificaciones = document.querySelector("#modo-notificaciones");
const opcionesResumenDiario = document.querySelector("#opciones-resumen-diario");
const campoHoraResumen = document.querySelector("#hora-resumen-diario");
const mensajeConfiguracion = document.querySelector("#mensaje-configuracion");
const casillaActivarNotificaciones = document.querySelector("#activar-notificaciones");
const botonCerrarNotificaciones = document.querySelector("#boton-cerrar-notificaciones");

const configuracionGuardada = localStorage.getItem("configuracionNotificaciones");

const configuracionNotificaciones = configuracionGuardada
  ? JSON.parse(configuracionGuardada)
  : {
      modo: "solo-actividades",
      horaResumen: "08:00",
      activasEnDispositivo: false,
    };

if (configuracionNotificaciones.modo === "desactivadas") {
  configuracionNotificaciones.modo = "solo-actividades";
}

function abrirMenu() {
  emergenteMenu.showModal();
}

function cerrarMenu() {
  emergenteMenu.close();
}

function cambiarOpcionesNotificaciones() {
  const modoElegido = selectorModoNotificaciones.value;
  const incluyeResumen =
    modoElegido === "solo-resumen" ||
    modoElegido === "resumen-y-actividades";

  opcionesResumenDiario.hidden = !incluyeResumen;
  campoHoraResumen.required = incluyeResumen;
  mensajeConfiguracion.hidden = true;
}

function abrirConfiguracionNotificaciones() {
  cerrarMenu();

  selectorModoNotificaciones.value = configuracionNotificaciones.modo;
  campoHoraResumen.value = configuracionNotificaciones.horaResumen;
  casillaActivarNotificaciones.checked =
    "Notification" in window &&
    Notification.permission === "granted" &&
    configuracionNotificaciones.activasEnDispositivo !== false;
  mensajeConfiguracion.hidden = true;

  cambiarOpcionesNotificaciones();
  emergenteNotificaciones.showModal();
}

function volverAlMenuDesdeNotificaciones() {
  emergenteNotificaciones.close();
  emergenteMenu.showModal();
}

function guardarConfiguracionNotificaciones(evento) {
  evento.preventDefault();

  const datosFormulario = new FormData(formularioNotificaciones);

  configuracionNotificaciones.modo = datosFormulario.get("modo");
  configuracionNotificaciones.horaResumen = datosFormulario.get("horaResumen");

  localStorage.setItem(
    "configuracionNotificaciones",
    JSON.stringify(configuracionNotificaciones)
  );

  mensajeConfiguracion.textContent = "Configuración guardada.";
  mensajeConfiguracion.hidden = false;
}

async function cambiarEstadoNotificaciones() {
  if (!casillaActivarNotificaciones.checked) {
    configuracionNotificaciones.activasEnDispositivo = false;
    localStorage.setItem(
      "configuracionNotificaciones",
      JSON.stringify(configuracionNotificaciones)
    );

    mensajeConfiguracion.textContent = "Notificaciones pausadas en este dispositivo.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    casillaActivarNotificaciones.checked = false;
    mensajeConfiguracion.textContent = "Este navegador no permite activar las notificaciones.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  try {
    const permiso = await Notification.requestPermission();

    if (permiso !== "granted") {
      casillaActivarNotificaciones.checked = false;
      configuracionNotificaciones.activasEnDispositivo = false;
      localStorage.setItem(
        "configuracionNotificaciones",
        JSON.stringify(configuracionNotificaciones)
      );
      mensajeConfiguracion.textContent = "No se han activado las notificaciones.";
      mensajeConfiguracion.hidden = false;
      return;
    }

    configuracionNotificaciones.activasEnDispositivo = true;
    localStorage.setItem(
      "configuracionNotificaciones",
      JSON.stringify(configuracionNotificaciones)
    );

    const registro = await navigator.serviceWorker.ready;

    await registro.showNotification("Atempo", {
      body: "Todo listo. Ya puedo avisarte cuando lo necesites.",
      icon: "./Branding/logos/PNG/simbolo-192.png",
      tag: "notificacion-prueba-atempo",
    });

    mensajeConfiguracion.textContent = "Notificaciones activadas.";
    mensajeConfiguracion.hidden = false;
  } catch (error) {
    casillaActivarNotificaciones.checked = false;
    configuracionNotificaciones.activasEnDispositivo = false;
    localStorage.setItem(
      "configuracionNotificaciones",
      JSON.stringify(configuracionNotificaciones)
    );
    console.log("No se pudo mostrar la notificación de prueba:", error);
    mensajeConfiguracion.textContent = "No se pudo mostrar la notificación de prueba.";
    mensajeConfiguracion.hidden = false;
  }
}

botonAbrirMenu.addEventListener("click", abrirMenu);
botonCerrarMenu.addEventListener("click", cerrarMenu);
botonMenuNotificaciones.addEventListener("click", abrirConfiguracionNotificaciones);
botonCerrarNotificaciones.addEventListener("click", volverAlMenuDesdeNotificaciones);
selectorModoNotificaciones.addEventListener("change", cambiarOpcionesNotificaciones);
formularioNotificaciones.addEventListener("submit", guardarConfiguracionNotificaciones);
casillaActivarNotificaciones.addEventListener("change", cambiarEstadoNotificaciones);
