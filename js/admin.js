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
