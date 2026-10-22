// Aviso mostrado una sola vez al estrenar una versión de Atempo.

const emergenteNovedades = document.querySelector("#emergente-novedades");
const versionNovedades = document.querySelector("#version-novedades");
const tituloNovedades = document.querySelector("#titulo-novedades");
const listaNovedades = document.querySelector("#lista-novedades");
const botonEntendidoNovedades = document.querySelector(
  "#boton-entendido-novedades"
);
const mensajeErrorNovedades = document.querySelector(
  "#mensaje-error-novedades"
);

let novedadPendiente = null;
let usuarioNovedades = null;

function rellenarAvisoNovedades(novedad) {
  versionNovedades.textContent = `Versión ${novedad.version}`;
  tituloNovedades.textContent = novedad.titulo;
  listaNovedades.replaceChildren();

  for (const cambio of novedad.cambios) {
    const elementoCambio = document.createElement("li");
    elementoCambio.textContent = cambio;
    listaNovedades.append(elementoCambio);
  }
}

async function comprobarNovedadPendiente() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    return;
  }

  usuarioNovedades = datosUsuario.user;

  const { data: novedad, error: errorNovedad } = await clienteSupabase
    .from("novedades_app")
    .select("id, version, titulo, cambios")
    .eq("version", VERSION_ATEMPO)
    .eq("activa", true)
    .lte("publicada_at", new Date().toISOString())
    .maybeSingle();

  if (errorNovedad) {
    console.log("No se pudo comprobar la novedad de la versión:", errorNovedad);
    registrarErrorApp("Comprobar novedades", errorNovedad);
    return;
  }

  if (!novedad) {
    return;
  }

  const { data: confirmacion, error: errorConfirmacion } = await clienteSupabase
    .from("novedades_leidas")
    .select("id")
    .eq("novedad_id", novedad.id)
    .eq("usuario_id", usuarioNovedades.id)
    .maybeSingle();

  if (errorConfirmacion) {
    console.log("No se pudo comprobar la confirmación de novedades:", errorConfirmacion);
    registrarErrorApp("Comprobar confirmación de novedades", errorConfirmacion);
    return;
  }

  if (confirmacion) {
    return;
  }

  novedadPendiente = novedad;
  rellenarAvisoNovedades(novedad);
  emergenteNovedades.showModal();
}

async function confirmarNovedad() {
  if (!novedadPendiente || !usuarioNovedades) {
    return;
  }

  botonEntendidoNovedades.disabled = true;
  botonEntendidoNovedades.textContent = "Guardando…";
  mensajeErrorNovedades.hidden = true;

  const { error } = await clienteSupabase.from("novedades_leidas").insert({
    novedad_id: novedadPendiente.id,
    usuario_id: usuarioNovedades.id,
  });

  botonEntendidoNovedades.disabled = false;
  botonEntendidoNovedades.textContent = "Entendido";

  if (error && error.code !== "23505") {
    console.log("No se pudo confirmar la novedad:", error);
    registrarErrorApp("Confirmar novedades", error);
    mensajeErrorNovedades.textContent =
      "No hemos podido guardar la confirmación. Inténtalo otra vez.";
    mensajeErrorNovedades.hidden = false;
    return;
  }

  emergenteNovedades.close();
  novedadPendiente = null;
}

botonEntendidoNovedades.addEventListener("click", confirmarNovedad);
