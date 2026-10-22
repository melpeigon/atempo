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
const formularioComunicacionAdmin = document.querySelector(
  "#formulario-comunicacion-admin"
);
const campoVersionComunicacionAdmin = document.querySelector(
  "#version-comunicacion-admin"
);
const campoTituloComunicacionAdmin = document.querySelector(
  "#titulo-comunicacion-admin"
);
const campoCambiosComunicacionAdmin = document.querySelector(
  "#cambios-comunicacion-admin"
);
const mensajeComunicacionAdmin = document.querySelector(
  "#mensaje-comunicacion-admin"
);
const botonPublicarComunicacionAdmin = document.querySelector(
  "#boton-publicar-comunicacion-admin"
);

let testersCargadosAdmin = [];

campoVersionComunicacionAdmin.value = VERSION_ATEMPO;
campoTituloComunicacionAdmin.value = "Atempo tiene cositas nuevas ✨";


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

    celda.colSpan = 7;
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

    const textoNovedades = tester.novedades_informadas
      ? "Informada"
      : "No informada";

    const claseNovedades = tester.novedades_informadas
      ? "etiqueta-activa"
      : "etiqueta-pendiente";

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
      crearCeldaConEtiqueta(textoNovedades, claseNovedades),
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
    "obtener_testers_admin",
    {
      version_actual: VERSION_ATEMPO,
    }
  );

  if (error) {
    console.error("No se pudo cargar el listado de testers:", error);
    listadoTestersAdmin.innerHTML = `
      <tr>
        <td colspan="7">No hemos podido cargar los testers.</td>
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

    if (errorApp.revisado) {
      errorElemento.classList.add("error-admin-revisado");
    }

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
      errorApp.origen === "procesador-avisos"
        ? "Procesador de avisos"
        : "Aplicación",
      errorApp.correo || "Error general",
      errorApp.codigo
        ? `Código: ${errorApp.codigo}`
        : null,
      errorApp.version_app
        ? `Versión ${errorApp.version_app}`
        : null,
      errorApp.plataforma || null,
    ].filter(Boolean);

    detalles.textContent = datosDetalles.join(" · ");

    const acciones = document.createElement("div");
    acciones.classList.add("acciones-error-admin");

    const estado = document.createElement("span");
    estado.classList.add(
      "etiqueta-admin",
      errorApp.revisado ? "etiqueta-activa" : "etiqueta-pendiente"
    );
    estado.textContent = errorApp.revisado ? "Revisado" : "Pendiente";

    const botonRevisar = document.createElement("button");
    botonRevisar.type = "button";
    botonRevisar.classList.add("boton-revisar-error-admin");
    botonRevisar.textContent = errorApp.revisado
      ? "Volver a pendiente"
      : "Marcar como revisado";

    botonRevisar.addEventListener("click", function () {
      cambiarEstadoErrorAdmin(
        errorApp.id,
        !errorApp.revisado,
        botonRevisar
      );
    });

    cabecera.append(contexto, fecha);
    acciones.append(estado, botonRevisar);
    errorElemento.append(cabecera, mensaje, detalles, acciones);
    listadoErroresAdmin.append(errorElemento);
  });
}

async function cambiarEstadoErrorAdmin(errorId, nuevoEstado, boton) {
  boton.disabled = true;

  const { data, error } = await clienteSupabase.rpc(
    "marcar_error_revisado",
    {
      error_id_objetivo: errorId,
      nuevo_estado: nuevoEstado,
    }
  );

  if (error || data !== true) {
    console.error("No se pudo actualizar el error:", error);
    boton.textContent = "No se pudo actualizar";
    boton.disabled = false;
    return;
  }

  await cargarErroresAdmin();
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

function mostrarMensajeComunicacionAdmin(mensaje, esError = false) {
  mensajeComunicacionAdmin.textContent = mensaje;
  mensajeComunicacionAdmin.classList.toggle(
    "mensaje-comunicacion-error",
    esError
  );
  mensajeComunicacionAdmin.hidden = false;
}

async function publicarComunicacionAdmin(evento) {
  evento.preventDefault();
  mensajeComunicacionAdmin.hidden = true;

  if (!formularioComunicacionAdmin.reportValidity()) {
    return;
  }

  const cambios = campoCambiosComunicacionAdmin.value
    .split("\n")
    .map(function (cambio) {
      return cambio.trim();
    })
    .filter(Boolean);

  if (cambios.length === 0 || cambios.length > 10) {
    mostrarMensajeComunicacionAdmin(
      "Escribe entre 1 y 10 novedades, una en cada línea.",
      true
    );
    return;
  }

  botonPublicarComunicacionAdmin.disabled = true;
  botonPublicarComunicacionAdmin.textContent = "Publicando…";

  const version = campoVersionComunicacionAdmin.value.trim();

  const { error } = await clienteSupabase.from("novedades_app").insert({
    version,
    titulo: campoTituloComunicacionAdmin.value.trim(),
    cambios,
    activa: true,
  });

  botonPublicarComunicacionAdmin.disabled = false;
  botonPublicarComunicacionAdmin.textContent = "Publicar novedades";

  if (error) {
    console.error("No se pudieron publicar las novedades:", error);

    if (error.code === "23505") {
      mostrarMensajeComunicacionAdmin(
        `Ya existe un aviso para la versión ${version}. Usa una versión nueva.`,
        true
      );
      return;
    }

    mostrarMensajeComunicacionAdmin(
      "No hemos podido publicar las novedades. Inténtalo de nuevo.",
      true
    );
    return;
  }

  mostrarMensajeComunicacionAdmin(
    `Novedades de la versión ${version} publicadas correctamente.`
  );
  campoCambiosComunicacionAdmin.value = "";
  await cargarTestersAdmin();
}

botonCerrarSesionAdmin.addEventListener("click", cerrarSesionAdmin);

comprobarAccesoAdmin();

buscarTesterAdmin.addEventListener("input", filtrarTestersAdmin);
formularioComunicacionAdmin.addEventListener(
  "submit",
  publicarComunicacionAdmin
);
