// =========================================================
// ACCESO AL PANEL DE ADMINISTRACIÓN
// =========================================================

const estadoAccesoAdmin = document.querySelector("#estado-acceso-admin");
const accesoDenegadoAdmin = document.querySelector("#acceso-denegado-admin");
const mensajeAccesoDenegadoAdmin = document.querySelector(
  "#mensaje-acceso-denegado-admin"
);
const panelAdmin = document.querySelector("#panel-admin");
const correoAdmin = document.querySelector("#correo-admin");
const botonCerrarSesionAdmin = document.querySelector(
  "#boton-cerrar-sesion-admin"
);
const totalTestersAdmin = document.querySelector("#total-testers-admin");
const testersActivosAdmin = document.querySelector("#testers-activos-admin");
const versionesPendientesAdmin = document.querySelector(
  "#versiones-pendientes-admin"
);

const listadoTestersAdmin = document.querySelector(
  "#listado-testers-admin"
);

const buscarTesterAdmin = document.querySelector("#buscar-tester-admin");

const listadoErroresAdmin = document.querySelector(
  "#listado-errores-admin"
);

let testersCargadosAdmin = [];



function mostrarAccesoDenegado(mensaje) {
  estadoAccesoAdmin.hidden = true;
  panelAdmin.hidden = true;
  mensajeAccesoDenegadoAdmin.textContent = mensaje;
  accesoDenegadoAdmin.hidden = false;
}

function mostrarPanelAdmin(usuario) {
  estadoAccesoAdmin.hidden = true;
  accesoDenegadoAdmin.hidden = true;
  correoAdmin.textContent = usuario.email || "Cuenta administradora";
  panelAdmin.hidden = false;
}

async function cargarResumenAdmin() {
  const { data, error } = await clienteSupabase.rpc(
    "obtener_resumen_admin",
    {
      version_actual: VERSION_ATEMPO,
    }
  );

  if (error) {
    console.error("No se pudo cargar el resumen del panel:", error);
    totalTestersAdmin.textContent = "—";
    testersActivosAdmin.textContent = "—";
    versionesPendientesAdmin.textContent = "—";
    return;
  }

  const resumen = data?.[0];

  totalTestersAdmin.textContent = resumen?.total_testers ?? 0;
  testersActivosAdmin.textContent = resumen?.testers_activos ?? 0;
  versionesPendientesAdmin.textContent =
    resumen?.versiones_pendientes ?? 0;
}

function formatearUltimaApertura(fecha) {
  if (!fecha) {
    return "Todavía no registrada";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function crearCeldaTester(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

function crearCeldaConEtiqueta(texto, clase) {
  const celda = document.createElement("td");
  const etiqueta = document.createElement("span");

  etiqueta.classList.add("etiqueta-admin", clase);
  etiqueta.textContent = texto;

  celda.append(etiqueta);

  return celda;
}

function mostrarTestersAdmin(testers) {
  listadoTestersAdmin.replaceChildren();

  if (testers.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCeldaTester("No hay testers que coincidan con la búsqueda.");

    celda.colSpan = 6;
    fila.append(celda);
    listadoTestersAdmin.append(fila);
    return;
  }

  testers.forEach(function (tester) {
    const fila = document.createElement("tr");

    const dispositivo = tester.plataforma
      ? `${tester.plataforma} · ${tester.instalada ? "Instalada" : "Navegador"}`
      : "Sin datos";

    const numeroDispositivos =
      Number(tester.notificaciones_activas) || 0;

    let textoNotificaciones = "Sin dispositivos activos";

    if (numeroDispositivos === 1) {
      textoNotificaciones = "1 dispositivo activo";
    }

    if (numeroDispositivos > 1) {
      textoNotificaciones =
        `${numeroDispositivos} dispositivos activos`;
    }

    const claseNotificaciones =
      numeroDispositivos > 0
        ? "etiqueta-notificaciones-activas"
        : "etiqueta-neutra";

    let claseEstado = "etiqueta-neutra";

    if (tester.estado === "Activa") {
      claseEstado = "etiqueta-activa";
    } else if (tester.estado === "Pendiente de confirmar") {
      claseEstado = "etiqueta-pendiente";
    } else if (tester.estado === "Sin actividad reciente") {
      claseEstado = "etiqueta-inactiva";
    }

    fila.append(
      crearCeldaTester(tester.correo || "Sin correo"),
      crearCeldaTester(dispositivo),
      crearCeldaTester(tester.version_app || "Sin datos"),
      crearCeldaTester(
        formatearUltimaApertura(tester.ultima_apertura)
      ),
      crearCeldaConEtiqueta(
        textoNotificaciones,
        claseNotificaciones
      ),
      crearCeldaConEtiqueta(
        tester.estado || "Sin datos",
        claseEstado
      )
    );

    listadoTestersAdmin.append(fila);
  });
}

async function cargarTestersAdmin() {
  const { data, error } = await clienteSupabase.rpc(
    "obtener_testers_admin"
  );

  if (error) {
    console.error("No se pudo cargar el listado de testers:", error);
    listadoTestersAdmin.innerHTML = `
      <tr>
        <td colspan="6">No hemos podido cargar los testers.</td>
      </tr>
    `;
    return;
  }

  testersCargadosAdmin = data || [];
  mostrarTestersAdmin(testersCargadosAdmin);
}

function mostrarErroresAdmin(errores) {
  listadoErroresAdmin.replaceChildren();

  if (errores.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.textContent = "No se han registrado errores recientes.";
    listadoErroresAdmin.append(mensaje);
    return;
  }

  errores.forEach(function (errorApp) {
    const errorElemento = document.createElement("article");
    errorElemento.classList.add("error-admin");

    const cabecera = document.createElement("header");

    const contexto = document.createElement("h3");
    contexto.textContent = errorApp.contexto;

    const fecha = document.createElement("time");
    fecha.textContent = formatearUltimaApertura(
      errorApp.fecha
    );

    const mensaje = document.createElement("p");
    mensaje.classList.add("mensaje-error-admin");
    mensaje.textContent = errorApp.mensaje;

    const detalles = document.createElement("p");
    detalles.classList.add("detalles-error-admin");

    const datosDetalles = [
      errorApp.correo || "Usuario desconocido",
      errorApp.codigo
        ? `Código: ${errorApp.codigo}`
        : null,
      errorApp.version_app
        ? `Versión ${errorApp.version_app}`
        : null,
      errorApp.plataforma || null,
    ].filter(Boolean);

    detalles.textContent = datosDetalles.join(" · ");

    cabecera.append(contexto, fecha);
    errorElemento.append(cabecera, mensaje, detalles);
    listadoErroresAdmin.append(errorElemento);
  });
}

async function cargarErroresAdmin() {
  const { data, error } = await clienteSupabase.rpc(
    "obtener_errores_admin"
  );

  if (error) {
    console.error(
      "No se pudieron cargar los errores:",
      error
    );

    listadoErroresAdmin.innerHTML = `
      <p>No hemos podido cargar los errores recientes.</p>
    `;

    return;
  }

  mostrarErroresAdmin(data || []);
}

function filtrarTestersAdmin() {
  const busqueda = buscarTesterAdmin.value
    .trim()
    .toLocaleLowerCase("es");

  if (busqueda === "") {
    mostrarTestersAdmin(testersCargadosAdmin);
    return;
  }

  const testersFiltrados = testersCargadosAdmin.filter(function (tester) {
    const datosBuscables = [
      tester.correo,
      tester.plataforma,
      tester.version_app,
      tester.estado,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("es");

    return datosBuscables.includes(busqueda);
  });

  mostrarTestersAdmin(testersFiltrados);
}

async function comprobarAccesoAdmin() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    mostrarAccesoDenegado(
      "Primero tienes que iniciar sesión en Atempo para entrar en este espacio."
    );
    return;
  }

  const { data: administradora, error: errorPermiso } = await clienteSupabase
    .from("administradores")
    .select("usuario_id")
    .eq("usuario_id", datosUsuario.user.id)
    .maybeSingle();

  if (errorPermiso) {
    console.error("No se pudo comprobar el acceso al panel:", errorPermiso);
    mostrarAccesoDenegado(
      "No hemos podido comprobar el acceso al panel. Inténtalo de nuevo en unos minutos."
    );
    return;
  }

  if (!administradora) {
    mostrarAccesoDenegado(
      "La cuenta con la que has entrado no tiene acceso al panel de administración."
    );
    return;
  }

  mostrarPanelAdmin(datosUsuario.user);
  await cargarResumenAdmin();
  await cargarTestersAdmin();
  await cargarErroresAdmin();
}

async function cerrarSesionAdmin() {
  botonCerrarSesionAdmin.disabled = true;

  const { error } = await clienteSupabase.auth.signOut();

  if (error) {
    console.error("No se pudo cerrar la sesión:", error);
    botonCerrarSesionAdmin.disabled = false;
    return;
  }

  window.location.replace("index.html");
}

botonCerrarSesionAdmin.addEventListener("click", cerrarSesionAdmin);

comprobarAccesoAdmin();

buscarTesterAdmin.addEventListener("input", filtrarTestersAdmin);
