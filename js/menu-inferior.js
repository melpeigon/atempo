// Navegación principal fija de la aplicación.

const contenedorNavegacionInferior = document.querySelector(".navegacion-inferior");
const botonesMenuInferior = [
  ...contenedorNavegacionInferior.querySelectorAll("[data-pantalla], [data-accion]")
];
const menuInferior = contenedorNavegacionInferior.querySelector(".menu-inferior");
const burbujaMenu = menuInferior.querySelector(".burbuja-menu");
const formaMenuInferior = menuInferior.querySelector(".forma-menu-inferior");
const trazadoMenuInferior = formaMenuInferior.querySelector(".trazado-menu-inferior");
const botonesSeccionMenuInferior = [
  ...menuInferior.querySelectorAll("[data-pantalla]")
];
const seccionPersonasAgenda = document.querySelector(".agenda");
const elevacionCurvaMenu = 22;
const semianchoCurvaMenu = 42;
const duracionMovimientoMenu = 360;
let centroCurvaActual = null;
let fotogramaCurva = null;

function dibujarFormaMenu(centroX) {
  const ancho = menuInferior.clientWidth;
  const alto = menuInferior.clientHeight;
  const elevacion = elevacionCurvaMenu;

  formaMenuInferior.style.setProperty("--elevacion-curva-menu", `${elevacion}px`);
  formaMenuInferior.setAttribute(
    "viewBox",
    `0 0 ${ancho} ${alto + elevacion}`
  );
  trazadoMenuInferior.setAttribute("d", crearTrazadoMenu(centroX));
}

function crearTrazadoMenu(centroX) {
  const ancho = menuInferior.clientWidth;
  const alto = menuInferior.clientHeight;
  const elevacion = elevacionCurvaMenu;
  const radio = alto / 2;
  const bordeSuperior = elevacion;
  const bordeInferior = alto + elevacion;

  const xInicioCurva = Math.max(0, centroX - semianchoCurvaMenu);
  const xFinalCurva = Math.min(ancho, centroX + semianchoCurvaMenu);
  const anchoHombroIzquierdo = centroX - xInicioCurva;
  const anchoHombroDerecho = xFinalCurva - centroX;

  const enEsquinaIzquierda = xInicioCurva < radio;
  const desplazamientoIzquierdo = xInicioCurva - radio;
  const yInicioCurva = enEsquinaIzquierda
    ? bordeSuperior + radio - Math.sqrt(radio ** 2 - desplazamientoIzquierdo ** 2)
    : bordeSuperior;
  const tangenteIzquierda = enEsquinaIzquierda
    ? {
        x: Math.sqrt(radio ** 2 - desplazamientoIzquierdo ** 2) / radio,
        y: desplazamientoIzquierdo / radio
      }
    : { x: 1, y: 0 };

  const enEsquinaDerecha = xFinalCurva > ancho - radio;
  const desplazamientoDerecho = xFinalCurva - (ancho - radio);
  const yFinalCurva = enEsquinaDerecha
    ? bordeSuperior + radio - Math.sqrt(radio ** 2 - desplazamientoDerecho ** 2)
    : bordeSuperior;
  const tangenteDerecha = enEsquinaDerecha
    ? {
        x: Math.sqrt(radio ** 2 - desplazamientoDerecho ** 2) / radio,
        y: desplazamientoDerecho / radio
      }
    : { x: 1, y: 0 };

  const trazado = [
    `M 0 ${bordeSuperior + radio}`
  ];

  if (enEsquinaIzquierda) {
    trazado.push(`A ${radio} ${radio} 0 0 1 ${xInicioCurva} ${yInicioCurva}`);
  } else {
    trazado.push(`A ${radio} ${radio} 0 0 1 ${radio} ${bordeSuperior}`);
    trazado.push(`L ${xInicioCurva} ${bordeSuperior}`);
  }

  trazado.push(
    `C ${xInicioCurva + anchoHombroIzquierdo * 0.552 * tangenteIzquierda.x} ${yInicioCurva + anchoHombroIzquierdo * 0.552 * tangenteIzquierda.y}, ${centroX - anchoHombroIzquierdo * 0.552} 0, ${centroX} 0`
  );
  trazado.push(
    `C ${centroX + anchoHombroDerecho * 0.552} 0, ${xFinalCurva - anchoHombroDerecho * 0.552 * tangenteDerecha.x} ${yFinalCurva - anchoHombroDerecho * 0.552 * tangenteDerecha.y}, ${xFinalCurva} ${yFinalCurva}`
  );

  if (enEsquinaDerecha) {
    trazado.push(`A ${radio} ${radio} 0 0 1 ${ancho} ${bordeSuperior + radio}`);
  } else {
    trazado.push(`L ${ancho - radio} ${bordeSuperior}`);
    trazado.push(`A ${radio} ${radio} 0 0 1 ${ancho} ${bordeSuperior + radio}`);
  }

  trazado.push(
    `L ${ancho} ${bordeInferior - radio}`,
    `A ${radio} ${radio} 0 0 1 ${ancho - radio} ${bordeInferior}`,
    `L ${radio} ${bordeInferior}`,
    `A ${radio} ${radio} 0 0 1 0 ${bordeInferior - radio}`,
    `L 0 ${bordeSuperior + radio}`,
    "Z"
  );

  return trazado.join(" ");
}

function colocarBurbujaEnBoton(boton) {
  const centroBoton = boton.offsetLeft + boton.offsetWidth / 2;

  burbujaMenu.style.left = `${centroBoton}px`;
  menuInferior.style.setProperty("--centro-activo", `${centroBoton}px`);

  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (centroCurvaActual === null || reducirMovimiento) {
    if (fotogramaCurva !== null) {
      cancelAnimationFrame(fotogramaCurva);
      fotogramaCurva = null;
    }
    centroCurvaActual = centroBoton;
    dibujarFormaMenu(centroBoton);
    return;
  }

  if (fotogramaCurva !== null) {
    cancelAnimationFrame(fotogramaCurva);
  }

  const centroInicial = centroCurvaActual;
  const diferencia = centroBoton - centroInicial;
  let inicioMovimiento = null;

  function animarCurva(marcaTiempo) {
    if (inicioMovimiento === null) inicioMovimiento = marcaTiempo;

    const progreso = Math.min((marcaTiempo - inicioMovimiento) / duracionMovimientoMenu, 1);
    const progresoSuave = suavizarMovimientoMenu(progreso);
    centroCurvaActual = centroInicial + diferencia * progresoSuave;
    dibujarFormaMenu(centroCurvaActual);

    if (progreso < 1) {
      fotogramaCurva = requestAnimationFrame(animarCurva);
    } else {
      centroCurvaActual = centroBoton;
      dibujarFormaMenu(centroBoton);
      fotogramaCurva = null;
    }
  }

  fotogramaCurva = requestAnimationFrame(animarCurva);
}

function suavizarMovimientoMenu(progreso) {
  // Aproxima el cubic-bezier(0.22, 0.75, 0.3, 1) usado por la burbuja en CSS.
  let minimo = 0;
  let maximo = 1;
  let parametro = progreso;

  for (let intento = 0; intento < 8; intento += 1) {
    const inversa = 1 - parametro;
    const posicionX = 3 * inversa ** 2 * parametro * 0.22
      + 3 * inversa * parametro ** 2 * 0.3
      + parametro ** 3;

    if (posicionX < progreso) minimo = parametro;
    else maximo = parametro;

    parametro = (minimo + maximo) / 2;
  }

  const inversa = 1 - parametro;
  return 3 * inversa ** 2 * parametro * 0.75
    + 3 * inversa * parametro ** 2
    + parametro ** 3;
}

function mostrarMenuInferior(mostrar) {
  contenedorNavegacionInferior.hidden = !mostrar;
  document.body.classList.toggle("con-menu-inferior", mostrar);

  if (mostrar) {
    actualizarSeleccionMenuInferior(obtenerPestanaDeEstado(history.state));
  }
}

function obtenerPestanaDeEstado(estado) {
  if (estado?.pantalla === "persona") return "personas";
  if (estado?.pantalla === "actividad") {
    if (estado.origen === "calendario") return "calendario";
    if (estado.origen === "persona") return "personas";
    return "hoy";
  }
  return estado?.pantalla || "hoy";
}

function actualizarSeleccionMenuInferior(pantalla) {
  const seccionesDisponibles = ["hoy", "calendario", "personas", "compartir"];
  const pantallaActiva = seccionesDisponibles.includes(pantalla) ? pantalla : "hoy";

  const botonActivo = botonesSeccionMenuInferior.find(
    (boton) => boton.dataset.pantalla === pantallaActiva
  );

  for (const boton of botonesSeccionMenuInferior) {
    if (boton === botonActivo) {
      boton.setAttribute("aria-current", "page");
    } else {
      boton.removeAttribute("aria-current");
    }
  }

  if (botonActivo) {
    colocarBurbujaEnBoton(botonActivo);
  }
}

function volverAInicioDesdeMenu() {
  history.pushState({ pantalla: "inicio" }, "");
  mostrarPantallaDesdeHistorial(history.state);
  actualizarSeleccionMenuInferior("hoy");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirPersonasDesdeMenu() {
  registrarPantalla("personas");
  mostrarPantallaDesdeHistorial(history.state);
  actualizarSeleccionMenuInferior("personas");
}

function abrirCompartirDesdeMenu() {
  registrarPantalla("compartir");
  mostrarPantallaDesdeHistorial(history.state);
  actualizarSeleccionMenuInferior("compartir");
  cargarPantallaCompartir();
}

for (const boton of botonesMenuInferior) {
  boton.addEventListener("click", function () {
    if (boton.dataset.accion === "anadir-actividad") {
      abrirEmergenteNuevaActividad();
      return;
    }

    switch (boton.dataset.pantalla) {
      case "hoy":
        volverAInicioDesdeMenu();
        break;
      case "calendario":
        abrirCalendario();
        actualizarSeleccionMenuInferior("calendario");
        break;
      case "personas":
        abrirPersonasDesdeMenu();
        break;
      case "compartir":
        abrirCompartirDesdeMenu();
        break;
    }
  });
}

window.addEventListener("popstate", function (evento) {
  actualizarSeleccionMenuInferior(obtenerPestanaDeEstado(evento.state));
  if (evento.state?.pantalla === "compartir") {
    cargarPantallaCompartir();
  }
});

window.addEventListener("resize", function () {
  const botonActivo = botonesSeccionMenuInferior.find(
    (boton) => boton.getAttribute("aria-current") === "page"
  );

  if (botonActivo && !contenedorNavegacionInferior.hidden) {
    colocarBurbujaEnBoton(botonActivo);
  }
});
