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

function mostrarTestersAdmin(testers) {
  listadoTestersAdmin.replaceChildren();

  testers.forEach(function (tester) {
    const fila = document.createElement("tr");

    const dispositivo = tester.plataforma
      ? `${tester.plataforma} · ${tester.instalada ? "Instalada" : "Navegador"}`
      : "Sin datos";

    const notificaciones = tester.notificaciones_activas > 0
      ? "Activas"
      : "Sin activar";

    fila.append(
      crearCeldaTester(tester.correo || "Sin correo"),
      crearCeldaTester(dispositivo),
      crearCeldaTester(tester.version_app || "Sin datos"),
      crearCeldaTester(formatearUltimaApertura(tester.ultima_apertura)),
      crearCeldaTester(notificaciones),
      crearCeldaTester(tester.estado)
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

  mostrarTestersAdmin(data || []);
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
