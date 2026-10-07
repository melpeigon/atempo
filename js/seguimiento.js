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
