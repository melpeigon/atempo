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

const configuracionAnterior = JSON.parse(
  localStorage.getItem("configuracionNotificaciones") || "null"
);

const configuracionNotificaciones = {
  modo: "solo-actividades",
  horaResumen: "08:00",
  activasEnDispositivo:
    localStorage.getItem("notificacionesActivasEnDispositivo") === "true" ||
    configuracionAnterior?.activasEnDispositivo === true,
};

localStorage.removeItem("configuracionNotificaciones");

function guardarEstadoLocalNotificaciones() {
  localStorage.setItem(
    "notificacionesActivasEnDispositivo",
    String(configuracionNotificaciones.activasEnDispositivo)
  );
}

async function cargarConfiguracionNotificaciones() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    console.log("No se pudo identificar al usuario:", errorUsuario);
    return false;
  }

  const { data, error } = await clienteSupabase
    .from("configuracion_notificaciones")
    .select("modo, hora_resumen")
    .eq("usuario_id", datosUsuario.user.id)
    .maybeSingle();

  if (error) {
    console.log("No se pudo cargar la configuración de notificaciones:", error);
    return false;
  }

  if (!data) {
    const { data: configuracionCreada, error: errorCreacion } =
      await clienteSupabase
        .from("configuracion_notificaciones")
        .insert({ usuario_id: datosUsuario.user.id })
        .select("modo, hora_resumen")
        .single();

    if (errorCreacion) {
      console.log("No se pudo crear la configuración de notificaciones:", errorCreacion);
      return false;
    }

    configuracionNotificaciones.modo = configuracionCreada.modo;
    configuracionNotificaciones.horaResumen = configuracionCreada.hora_resumen.slice(0, 5);
    return true;
  }

  configuracionNotificaciones.modo = data.modo;
  configuracionNotificaciones.horaResumen = data.hora_resumen.slice(0, 5);
  return true;
}

function abrirMenu() {
  emergenteMenu.showModal();
  registrarPantalla("menu");
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
  registrarPantalla("notificaciones");
}

function volverAlMenuDesdeNotificaciones() {
  history.back();
}

function volverDesdeMenu() {
  history.back();
}

async function guardarConfiguracionNotificaciones(evento) {
  evento.preventDefault();

  const datosFormulario = new FormData(formularioNotificaciones);
  const modoElegido = datosFormulario.get("modo");
  const horaResumenElegida = datosFormulario.get("horaResumen") || "08:00";

  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    mensajeConfiguracion.textContent = "No hemos podido identificar tu cuenta.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  const { data, error } = await clienteSupabase
    .from("configuracion_notificaciones")
    .update({
      modo: modoElegido,
      hora_resumen: horaResumenElegida,
    })
    .eq("usuario_id", datosUsuario.user.id)
    .select("usuario_id")
    .maybeSingle();

  if (error) {
    console.log("No se pudo guardar la configuración de notificaciones:", error);
    mensajeConfiguracion.textContent = "No hemos podido guardar las preferencias.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  if (!data) {
    mensajeConfiguracion.textContent = "La base de datos no ha permitido guardar las preferencias.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  configuracionNotificaciones.modo = modoElegido;
  configuracionNotificaciones.horaResumen = horaResumenElegida;

  mensajeConfiguracion.textContent = "Configuración guardada.";
  mensajeConfiguracion.hidden = false;
}

async function cambiarEstadoNotificaciones() {
  if (!casillaActivarNotificaciones.checked) {
    configuracionNotificaciones.activasEnDispositivo = false;
    guardarEstadoLocalNotificaciones();

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
      guardarEstadoLocalNotificaciones();
      mensajeConfiguracion.textContent = "No se han activado las notificaciones.";
      mensajeConfiguracion.hidden = false;
      return;
    }

    configuracionNotificaciones.activasEnDispositivo = true;
    guardarEstadoLocalNotificaciones();

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
    guardarEstadoLocalNotificaciones();
    console.log("No se pudo mostrar la notificación de prueba:", error);
    mensajeConfiguracion.textContent = "No se pudo mostrar la notificación de prueba.";
    mensajeConfiguracion.hidden = false;
  }
}

botonAbrirMenu.addEventListener("click", abrirMenu);
botonCerrarMenu.addEventListener("click", volverDesdeMenu);
botonMenuNotificaciones.addEventListener("click", abrirConfiguracionNotificaciones);
botonCerrarNotificaciones.addEventListener("click", volverAlMenuDesdeNotificaciones);
selectorModoNotificaciones.addEventListener("change", cambiarOpcionesNotificaciones);
formularioNotificaciones.addEventListener("submit", guardarConfiguracionNotificaciones);
casillaActivarNotificaciones.addEventListener("change", cambiarEstadoNotificaciones);
