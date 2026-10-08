// =========================================================
// SEGUIMIENTO TÉCNICO DE USO
// =========================================================

function obtenerPlataforma() {
  return (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    "Plataforma desconocida"
  );
}

function comprobarSiEstaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

async function registrarAperturaUsuario() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    console.log("No se pudo identificar al usuario para registrar la apertura.");
    return false;
  }

  const { error } = await clienteSupabase
    .from("actividad_usuarios")
    .upsert(
      {
        usuario_id: datosUsuario.user.id,
        ultima_apertura: new Date().toISOString(),
        version_app: VERSION_ATEMPO,
        plataforma: obtenerPlataforma(),
        instalada: comprobarSiEstaInstalada(),
      },
      { onConflict: "usuario_id" }
    );

  if (error) {
    console.log("No se pudo registrar la apertura de Atempo:", error);
    return false;
  }

  return true;
}


// =========================================================
// REGISTRO DE ERRORES
// =========================================================

async function registrarErrorApp(contexto, error) {
  try {
    const { data: datosUsuario } =
      await clienteSupabase.auth.getUser();

    if (!datosUsuario.user) {
      return false;
    }

    const mensaje =
      error?.message ||
      String(error || "Error desconocido");

    const codigo =
      error?.code
        ? String(error.code)
        : null;

    const { error: errorRegistro } = await clienteSupabase
      .from("errores_app")
      .insert({
        usuario_id: datosUsuario.user.id,
        contexto: contexto.slice(0, 80),
        mensaje: mensaje.slice(0, 500),
        codigo: codigo?.slice(0, 80) || null,
        version_app: VERSION_ATEMPO,
        plataforma: obtenerPlataforma().slice(0, 100),
        pagina: window.location.pathname.slice(0, 500),
      });

    if (errorRegistro) {
      console.warn(
        "No se pudo registrar el error técnico:",
        errorRegistro
      );

      return false;
    }

    return true;
  } catch (errorRegistro) {
    console.warn(
      "No se pudo preparar el registro del error:",
      errorRegistro
    );

    return false;
  }
}

