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
const avisoNotificacionesDesconectadas = document.querySelector(
  "#aviso-notificaciones-desconectadas"
);
const botonRevisarNotificaciones = document.querySelector(
  "#boton-revisar-notificaciones"
);

const CLAVE_PUBLICA_VAPID = "BMWrMGicHyXmdj6rBAUJzlq501Kk0OUG7kXuhbRyrJj7qnATtGSBDVDj16lsvSKcT_IFhGcvm7P-fiJHCmXodjI";

const configuracionAnterior = JSON.parse(
  localStorage.getItem("configuracionNotificaciones") || "null"
);

const configuracionNotificaciones = {
  modo: "solo-actividades",
  horaResumen: "08:00",
  activasEnDispositivo:
    localStorage.getItem("notificacionesActivasEnDispositivo") === "true" ||
    configuracionAnterior?.activasEnDispositivo === true,
  deseadasEnDispositivo:
    localStorage.getItem("notificacionesDeseadasEnDispositivo") === "true" ||
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

function guardarPreferenciaLocalNotificaciones() {
  localStorage.setItem(
    "notificacionesDeseadasEnDispositivo",
    String(configuracionNotificaciones.deseadasEnDispositivo)
  );
}

function convertirClaveVapid(clave) {
  const relleno = "=".repeat((4 - (clave.length % 4)) % 4);
  const base64 = (clave + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const datosBinarios = atob(base64);
  const resultado = new Uint8Array(datosBinarios.length);

  for (let indice = 0; indice < datosBinarios.length; indice++) {
    resultado[indice] = datosBinarios.charCodeAt(indice);
  }

  return resultado;
}

async function guardarDispositivoEnSupabase(suscripcion) {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const datosSuscripcion = suscripcion.toJSON();
  const nombreDispositivo = navigator.userAgentData?.platform ||
    navigator.platform ||
    "Dispositivo";

  const { error } = await clienteSupabase
    .from("dispositivos_notificaciones")
    .upsert(
      {
        usuario_id: datosUsuario.user.id,
        endpoint: datosSuscripcion.endpoint,
        clave_p256dh: datosSuscripcion.keys.p256dh,
        clave_auth: datosSuscripcion.keys.auth,
        nombre_dispositivo: nombreDispositivo,
        activo: true,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    throw error;
  }
}

async function obtenerSuscripcionPush() {
  const registro = await navigator.serviceWorker.ready;
  return registro.pushManager.getSubscription();
}

async function comprobarEstadoNotificacionesAlIniciar() {
  const estabanActivas = configuracionNotificaciones.deseadasEnDispositivo;

  if (!estabanActivas) {
    avisoNotificacionesDesconectadas.hidden = true;
    return;
  }

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    avisoNotificacionesDesconectadas.hidden = false;
    return;
  }

  if (Notification.permission !== "granted") {
    configuracionNotificaciones.activasEnDispositivo = false;
    guardarEstadoLocalNotificaciones();
    avisoNotificacionesDesconectadas.hidden = false;
    return;
  }

  try {
    const registro = await navigator.serviceWorker.ready;
    let suscripcion = await registro.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertirClaveVapid(CLAVE_PUBLICA_VAPID),
      });
    }

    await guardarDispositivoEnSupabase(suscripcion);

    configuracionNotificaciones.activasEnDispositivo = true;
    guardarEstadoLocalNotificaciones();
    avisoNotificacionesDesconectadas.hidden = true;
  } catch (error) {
    console.log("No se pudieron recuperar las notificaciones:", error);
    configuracionNotificaciones.activasEnDispositivo = false;
    guardarEstadoLocalNotificaciones();
    avisoNotificacionesDesconectadas.hidden = false;
  }
}

async function retirarDispositivoAlCerrarSesion() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const suscripcion = await obtenerSuscripcionPush();

  if (!suscripcion) {
    return;
  }

  const { error } = await clienteSupabase
    .from("dispositivos_notificaciones")
    .delete()
    .eq("endpoint", suscripcion.endpoint);

  if (error) {
    console.log("No se pudo retirar el dispositivo:", error);
    return;
  }

  await suscripcion.unsubscribe();
  configuracionNotificaciones.activasEnDispositivo = false;
  configuracionNotificaciones.deseadasEnDispositivo = false;
  guardarEstadoLocalNotificaciones();
  guardarPreferenciaLocalNotificaciones();
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

async function abrirConfiguracionNotificaciones() {
  cerrarMenu();

  selectorModoNotificaciones.value = configuracionNotificaciones.modo;
  campoHoraResumen.value = configuracionNotificaciones.horaResumen;

  let suscripcion = null;

  if ("serviceWorker" in navigator && "PushManager" in window) {
    suscripcion = await obtenerSuscripcionPush();
  }

  configuracionNotificaciones.activasEnDispositivo =
    "Notification" in window &&
    Notification.permission === "granted" &&
    suscripcion !== null;
  guardarEstadoLocalNotificaciones();

  casillaActivarNotificaciones.checked =
    "Notification" in window &&
    Notification.permission === "granted" &&
    configuracionNotificaciones.activasEnDispositivo;
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
    let suscripcion = null;

    if ("serviceWorker" in navigator && "PushManager" in window) {
      suscripcion = await obtenerSuscripcionPush();
    }

    if (suscripcion) {
      const { error } = await clienteSupabase
        .from("dispositivos_notificaciones")
        .update({ activo: false })
        .eq("endpoint", suscripcion.endpoint);

      if (error) {
        console.log("No se pudo pausar el dispositivo:", error);
        casillaActivarNotificaciones.checked = true;
        mensajeConfiguracion.textContent = "No hemos podido pausar las notificaciones.";
        mensajeConfiguracion.hidden = false;
        return;
      }
    }

    configuracionNotificaciones.activasEnDispositivo = false;
    configuracionNotificaciones.deseadasEnDispositivo = false;
    guardarEstadoLocalNotificaciones();
    guardarPreferenciaLocalNotificaciones();
    avisoNotificacionesDesconectadas.hidden = true;

    mensajeConfiguracion.textContent = "Notificaciones pausadas en este dispositivo.";
    mensajeConfiguracion.hidden = false;
    return;
  }

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
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

    const registro = await navigator.serviceWorker.ready;
    let suscripcion = await registro.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertirClaveVapid(CLAVE_PUBLICA_VAPID),
      });
    }

    await guardarDispositivoEnSupabase(suscripcion);

    configuracionNotificaciones.activasEnDispositivo = true;
    configuracionNotificaciones.deseadasEnDispositivo = true;
    guardarEstadoLocalNotificaciones();
    guardarPreferenciaLocalNotificaciones();
    avisoNotificacionesDesconectadas.hidden = true;

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
botonRevisarNotificaciones.addEventListener(
  "click",
  abrirConfiguracionNotificaciones
);
selectorModoNotificaciones.addEventListener("change", cambiarOpcionesNotificaciones);
formularioNotificaciones.addEventListener("submit", guardarConfiguracionNotificaciones);
casillaActivarNotificaciones.addEventListener("change", cambiarEstadoNotificaciones);
