// Reúne en un solo aviso las novedades pendientes desde el alta de la usuaria.

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

let novedadesPendientes = [];
let usuarioNovedades = null;

function separarVersion(version) {
  if (!/^\d+(?:\.\d+){0,2}$/.test(version)) {
    return null;
  }

  return version.split(".").map(Number);
}

function versionNoSuperior(version, versionInstalada) {
  const partesVersion = separarVersion(version);
  const partesInstalada = separarVersion(versionInstalada);

  if (!partesVersion || !partesInstalada) {
    return false;
  }

  for (let indice = 0; indice < 3; indice++) {
    const numeroNovedad = partesVersion[indice] || 0;
    const numeroInstalado = partesInstalada[indice] || 0;

    if (numeroNovedad !== numeroInstalado) {
      return numeroNovedad < numeroInstalado;
    }
  }

  return true;
}

function rellenarAvisoNovedades(novedades) {
  versionNovedades.textContent = novedades.length === 1
    ? `Versión ${novedades[0].version}`
    : `${novedades.length} actualizaciones pendientes`;
  tituloNovedades.textContent = novedades.length === 1
    ? novedades[0].titulo
    : "Novedades desde que te uniste a Atempo";
  listaNovedades.replaceChildren();

  for (const novedad of novedades) {
    const elementoVersion = document.createElement("li");
    const encabezadoVersion = document.createElement("strong");
    const listaCambios = document.createElement("ul");

    encabezadoVersion.textContent = `Versión ${novedad.version}`;
    listaCambios.className = "cambios-version-novedad";

    for (const cambio of novedad.cambios) {
      const elementoCambio = document.createElement("li");
      elementoCambio.textContent = cambio;
      listaCambios.append(elementoCambio);
    }

    elementoVersion.append(encabezadoVersion, listaCambios);
    listaNovedades.append(elementoVersion);
  }
}

async function comprobarNovedadPendiente() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    return;
  }

  usuarioNovedades = datosUsuario.user;

  const { data: novedades, error: errorNovedades } = await clienteSupabase
    .from("novedades_app")
    .select("id, version, titulo, cambios, publicada_at")
    .eq("activa", true)
    .gte("publicada_at", usuarioNovedades.created_at)
    .lte("publicada_at", new Date().toISOString())
    .order("publicada_at", { ascending: true });

  if (errorNovedades) {
    console.log("No se pudieron comprobar las novedades:", errorNovedades);
    registrarErrorApp("Comprobar novedades", errorNovedades);
    return;
  }

  const novedadesDisponibles = (novedades || []).filter(function (novedad) {
    return versionNoSuperior(novedad.version, VERSION_ATEMPO);
  });

  if (novedadesDisponibles.length === 0) {
    return;
  }

  const { data: confirmaciones, error: errorConfirmaciones } = await clienteSupabase
    .from("novedades_leidas")
    .select("novedad_id")
    .eq("usuario_id", usuarioNovedades.id);

  if (errorConfirmaciones) {
    console.log("No se pudieron comprobar las confirmaciones:", errorConfirmaciones);
    registrarErrorApp("Comprobar confirmación de novedades", errorConfirmaciones);
    return;
  }

  const idsConfirmados = new Set(
    (confirmaciones || []).map(function (confirmacion) {
      return confirmacion.novedad_id;
    })
  );

  novedadesPendientes = novedadesDisponibles.filter(function (novedad) {
    return !idsConfirmados.has(novedad.id);
  });

  if (novedadesPendientes.length === 0) {
    return;
  }

  rellenarAvisoNovedades(novedadesPendientes);
  emergenteNovedades.showModal();
}

async function confirmarNovedad() {
  if (novedadesPendientes.length === 0 || !usuarioNovedades) {
    return;
  }

  botonEntendidoNovedades.disabled = true;
  botonEntendidoNovedades.textContent = "Guardando…";
  mensajeErrorNovedades.hidden = true;

  const confirmaciones = novedadesPendientes.map(function (novedad) {
    return {
      novedad_id: novedad.id,
      usuario_id: usuarioNovedades.id,
    };
  });

  const { error } = await clienteSupabase
    .from("novedades_leidas")
    .upsert(confirmaciones, {
      onConflict: "novedad_id,usuario_id",
      ignoreDuplicates: true,
    });

  botonEntendidoNovedades.disabled = false;
  botonEntendidoNovedades.textContent = "Entendido";

  if (error) {
    console.log("No se pudieron confirmar las novedades:", error);
    registrarErrorApp("Confirmar novedades", error);
    mensajeErrorNovedades.textContent =
      "No hemos podido guardar la confirmación. Inténtalo otra vez.";
    mensajeErrorNovedades.hidden = false;
    return;
  }

  emergenteNovedades.close();
  novedadesPendientes = [];
}

botonEntendidoNovedades.addEventListener("click", confirmarNovedad);
