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
const botonCerrarNotificaciones = document.querySelector("#boton-cerrar-notificaciones");

const configuracionGuardada = localStorage.getItem("configuracionNotificaciones");

const configuracionNotificaciones = configuracionGuardada
  ? JSON.parse(configuracionGuardada)
  : {
      modo: "desactivadas",
      horaResumen: "08:00",
    };

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

  mensajeConfiguracion.hidden = false;
}

botonAbrirMenu.addEventListener("click", abrirMenu);
botonCerrarMenu.addEventListener("click", cerrarMenu);
botonMenuNotificaciones.addEventListener("click", abrirConfiguracionNotificaciones);
botonCerrarNotificaciones.addEventListener("click", volverAlMenuDesdeNotificaciones);
selectorModoNotificaciones.addEventListener("change", cambiarOpcionesNotificaciones);
formularioNotificaciones.addEventListener("submit", guardarConfiguracionNotificaciones);
