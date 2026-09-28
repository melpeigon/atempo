// Navegación con el botón Atrás del móvil

function registrarPantalla(nombrePantalla, datos = {}) {
  history.pushState(
    {
      pantalla: nombrePantalla,
      ...datos,
    },
    ""
  );
}

function cerrarDialogosDeNavegacion() {
  if (emergenteMenu.open) {
    emergenteMenu.close();
  }

  if (emergenteNotificaciones.open) {
    emergenteNotificaciones.close();
  }
}

function mostrarInicioDesdeHistorial() {
  cerrarDialogosDeNavegacion();

  pantallaInicio.hidden = false;
  pantallaCalendario.hidden = true;
  fichaPersona.hidden = true;
  fichaActividad.hidden = true;
  pantallaGuia.hidden = true;
}

function mostrarPantallaDesdeHistorial(estado) {
  const pantalla = estado?.pantalla || "inicio";

  mostrarInicioDesdeHistorial();

  if (pantalla === "calendario") {
    pantallaInicio.hidden = true;
    pantallaCalendario.hidden = false;
    return;
  }

  if (pantalla === "persona") {
    abrirFichaPersona(estado.idPersona, false);
    return;
  }

  if (pantalla === "actividad") {
    if (estado.origen === "calendario") {
      pantallaCalendario.hidden = true;
    }

    abrirFichaActividad(estado.idActividad, estado.origen, false);
    return;
  }

  if (pantalla === "menu") {
    emergenteMenu.showModal();
    return;
  }

  if (pantalla === "notificaciones") {
    abrirConfiguracionNotificacionesDesdeHistorial();
    return;
  }

  if (pantalla === "guia") {
    pantallaInicio.hidden = true;
    pantallaGuia.hidden = false;
    window.scrollTo(0, 0);
  }
}

function abrirConfiguracionNotificacionesDesdeHistorial() {
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

history.replaceState({ pantalla: "inicio" }, "");

window.addEventListener("popstate", function (evento) {
  mostrarPantallaDesdeHistorial(evento.state);
});

emergenteMenu.addEventListener("cancel", function (evento) {
  evento.preventDefault();
  history.back();
});

emergenteNotificaciones.addEventListener("cancel", function (evento) {
  evento.preventDefault();
  history.back();
});
