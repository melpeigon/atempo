const parametrosInvitacion = new URLSearchParams(window.location.search);
const tokenInvitacion = parametrosInvitacion.get("token");
const enlaceVolverInvitaciones = document.querySelector("#enlace-volver-atempo");

if (parametrosInvitacion.get("desde") === "bienvenida") {
  const paso = parametrosInvitacion.get("paso") || "compartir";
  const revisar = parametrosInvitacion.get("revisar") === "1";
  enlaceVolverInvitaciones.href = `bienvenida.html?paso=${encodeURIComponent(paso)}${revisar ? "&revisar=1" : ""}`;
  if (revisar) sessionStorage.setItem("atempo-bienvenida-revision", "1");
  enlaceVolverInvitaciones.textContent = "← Volver a los primeros pasos";
}

const estadoCargandoInvitaciones = document.querySelector("#estado-cargando");
const panelAccesoInvitaciones = document.querySelector("#panel-acceso");
const panelCrearInvitacion = document.querySelector("#panel-crear-invitacion");
const panelAceptarInvitacion = document.querySelector("#panel-aceptar-invitacion");
const formularioAccesoInvitaciones = document.querySelector("#formulario-acceso-invitaciones");
const correoAccesoInvitaciones = document.querySelector("#correo-invitaciones");
const contrasenaAccesoInvitaciones = document.querySelector("#contrasena-invitaciones");
const mensajeAccesoInvitaciones = document.querySelector("#mensaje-acceso-invitaciones");
const botonEntrarInvitaciones = document.querySelector("#boton-entrar-invitaciones");
const botonCrearCuentaInvitaciones = document.querySelector("#boton-crear-cuenta-invitaciones");
const formularioCrearInvitacion = document.querySelector("#formulario-crear-invitacion");
const selectorAgendaInvitaciones = document.querySelector("#agenda-invitaciones");
const correoInvitado = document.querySelector("#correo-invitado");
const listaPerfilesInvitacion = document.querySelector("#lista-perfiles-invitacion");
const casillaEdicionInvitacion = document.querySelector("#permite-editar-invitacion");
const resumenPerfilesInvitacion = document.querySelector("#resumen-perfiles-invitacion");
const resumenEdicionInvitacion = document.querySelector("#resumen-edicion-invitacion");
const mensajeCrearInvitacion = document.querySelector("#mensaje-crear-invitacion");
const botonGenerarInvitacion = document.querySelector("#boton-generar-invitacion");
const contenedorEnlaceGenerado = document.querySelector("#enlace-generado-invitaciones");
const campoEnlaceGenerado = document.querySelector("#url-invitacion-generada");
const botonCopiarInvitacion = document.querySelector("#boton-copiar-invitacion");
const panelPermisosMiembros = document.querySelector("#panel-permisos-miembros");
const selectorMiembroPermisos = document.querySelector("#miembro-permisos");
const listaPerfilesPermisos = document.querySelector("#lista-perfiles-permisos");
const mensajePermisosMiembros = document.querySelector("#mensaje-permisos-miembros");
const botonGuardarPermisos = document.querySelector("#boton-guardar-permisos");
const casillaEdicionMiembro = document.querySelector("#permite-editar-miembro");
const panelPermisoPropio = document.querySelector("#panel-permiso-propio");
const selectorAgendaPermisoPropio = document.querySelector("#agenda-permiso-propio");
const selectorAdultoPermisoPropio = document.querySelector("#adulto-permiso-propio");
const casillaPermisoPropio = document.querySelector("#permite-editar-propio");
const mensajePermisoPropio = document.querySelector("#mensaje-permiso-propio");
const botonGuardarPermisoPropio = document.querySelector("#boton-guardar-permiso-propio");
const formularioAceptarInvitacion = document.querySelector("#formulario-aceptar-invitacion");
const mensajeAceptarInvitacion = document.querySelector("#mensaje-aceptar-invitacion");
const botonAceptarInvitacion = document.querySelector("#boton-aceptar-invitacion");
let perfilesAgendaInvitaciones = [];
let miembrosAgendaInvitaciones = [];
let agendasCompartidasPropias = [];

function mostrarMensajeInvitaciones(elemento, mensaje, esError = false) {
  elemento.textContent = mensaje;
  elemento.classList.toggle("es-error", esError);
  elemento.hidden = false;
}

function limpiarMensajeInvitaciones(elemento) {
  elemento.textContent = "";
  elemento.classList.remove("es-error");
  elemento.hidden = true;
}

function mostrarEstadoInvitaciones(mensaje) {
  estadoCargandoInvitaciones.textContent = mensaje;
  estadoCargandoInvitaciones.hidden = false;
}

function ocultarEstadoInvitaciones() {
  estadoCargandoInvitaciones.hidden = true;
}

function mostrarFormularioAccesoInvitaciones() {
  panelAccesoInvitaciones.hidden = false;
  botonCrearCuentaInvitaciones.hidden = !tokenInvitacion;
  mostrarEstadoInvitaciones(
    tokenInvitacion
      ? "Inicia sesión o crea una cuenta con el correo al que llegó la invitación."
      : "Inicia sesión para crear una invitación."
  );
}

async function iniciarSesionInvitaciones(evento) {
  evento.preventDefault();
  limpiarMensajeInvitaciones(mensajeAccesoInvitaciones);
  botonEntrarInvitaciones.disabled = true;
  botonEntrarInvitaciones.textContent = "Entrando…";

  const { error } = await clienteSupabase.auth.signInWithPassword({
    email: correoAccesoInvitaciones.value.trim(),
    password: contrasenaAccesoInvitaciones.value,
  });

  botonEntrarInvitaciones.disabled = false;
  botonEntrarInvitaciones.textContent = "Entrar";

  if (error) {
    mostrarMensajeInvitaciones(
      mensajeAccesoInvitaciones,
      "No hemos podido iniciar sesión. Revisa el correo y la contraseña.",
      true
    );
    return;
  }

  await prepararPaginaInvitaciones();
}

async function crearCuentaDesdeInvitacion() {
  limpiarMensajeInvitaciones(mensajeAccesoInvitaciones);

  if (!formularioAccesoInvitaciones.reportValidity()) return;

  botonCrearCuentaInvitaciones.disabled = true;
  botonCrearCuentaInvitaciones.textContent = "Creando cuenta…";

  const { data, error } = await clienteSupabase.auth.signUp({
    email: correoAccesoInvitaciones.value.trim(),
    password: contrasenaAccesoInvitaciones.value,
    options: { emailRedirectTo: window.location.href },
  });

  botonCrearCuentaInvitaciones.disabled = false;
  botonCrearCuentaInvitaciones.textContent = "Crear una cuenta";

  if (error) {
    mostrarMensajeInvitaciones(
      mensajeAccesoInvitaciones,
      error.code === "user_already_exists" || error.code === "email_exists"
        ? "Ya existe una cuenta con ese correo. Entra con tu contraseña."
        : "No hemos podido crear la cuenta. Comprueba el correo y que la contraseña tenga al menos 6 caracteres.",
      true
    );
    return;
  }

  if (!data.session) {
    mostrarMensajeInvitaciones(
      mensajeAccesoInvitaciones,
      "Cuenta creada. Confirma el correo y abre el enlace desde el mismo dispositivo para continuar con la invitación."
    );
    return;
  }

  await prepararPaginaInvitaciones();
}

async function cargarAgendasParaInvitar(usuarioId) {
  const { data, error } = await clienteSupabase
    .from("miembros_familia")
    .select("familia_id, rol, familias!miembros_familia_familia_id_fkey(id, nombre)")
    .eq("usuario_id", usuarioId)
    .eq("rol", "propietaria");

  if (error) throw error;

  const agendas = (data || [])
    .filter((membresia) => membresia.familias)
    .map((membresia) => ({
      id: membresia.familias.id,
      nombre: membresia.familias.nombre,
    }));

  selectorAgendaInvitaciones.replaceChildren();
  agendas.forEach((agenda) => {
    selectorAgendaInvitaciones.add(new Option(agenda.nombre, agenda.id));
  });

  if (agendas.length === 0) {
    throw new Error("No encontramos una agenda que puedas compartir.");
  }

  await cargarPerfilesAgenda(selectorAgendaInvitaciones.value);
  await cargarMiembrosAgenda(selectorAgendaInvitaciones.value);

  return agendas;
}

function renderizarCasillasPerfiles(contenedor, perfiles, idsMarcados = []) {
  contenedor.replaceChildren();

  for (const perfil of perfiles) {
    const etiqueta = document.createElement("label");
    const casilla = document.createElement("input");
    const texto = document.createElement("span");
    const tipo = document.createElement("small");

    etiqueta.className = "opcion-perfil-invitacion";
    casilla.type = "checkbox";
    casilla.value = perfil.id;
    casilla.checked = idsMarcados.includes(perfil.id);
    texto.textContent = perfil.nombre;
    tipo.textContent = perfil.tipo_persona === "adulto" ? "Adulto" : "Menor";
    etiqueta.append(casilla, texto, tipo);
    contenedor.append(etiqueta);
  }

  if (perfiles.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "ayuda-perfiles-invitacion";
    vacio.textContent = "No hay perfiles disponibles en esta agenda.";
    contenedor.append(vacio);
  }
}

async function cargarPerfilesAgenda(familiaId) {
  const { data, error } = await clienteSupabase
    .from("personas")
    .select("id, nombre, tipo_persona, usuario_id, created_at")
    .eq("familia_id", familiaId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const { data: usuarioActual } = await clienteSupabase.auth.getUser();
  perfilesAgendaInvitaciones = (data || []).filter((perfil) =>
    perfil.tipo_persona === "menor" || perfil.usuario_id === null || perfil.usuario_id === usuarioActual.user?.id
  );
  renderizarCasillasPerfiles(
    listaPerfilesInvitacion,
    perfilesAgendaInvitaciones,
    perfilesAgendaInvitaciones
      .filter((perfil) => perfil.tipo_persona === "menor")
      .map((perfil) => perfil.id)
  );
  actualizarEstadoCasillaEdicion(listaPerfilesInvitacion, casillaEdicionInvitacion);
  actualizarResumenInvitacion();
  if (perfilesAgendaInvitaciones.length === 0) {
    throw new Error("No encontramos perfiles que puedas compartir en esta agenda.");
  }
}

async function cargarMiembrosAgenda(familiaId) {
  const { data, error } = await clienteSupabase.rpc("obtener_miembros_compartidos", {
    familia_consultada: familiaId,
  });

  if (error) throw error;
  miembrosAgendaInvitaciones = data || [];
  panelPermisosMiembros.hidden = miembrosAgendaInvitaciones.length === 0;
  selectorMiembroPermisos.replaceChildren();

  for (const miembro of miembrosAgendaInvitaciones) {
    selectorMiembroPermisos.add(new Option(miembro.email || "Adulto de la agenda", miembro.usuario_id));
  }

  if (miembrosAgendaInvitaciones.length > 0) await cargarPermisosMiembro();
}

async function mostrarPanelPermisoPropio(usuario) {
  const { data, error } = await clienteSupabase
    .from("miembros_familia")
    .select("familia_id, familias!miembros_familia_familia_id_fkey(id, nombre)")
    .eq("usuario_id", usuario.id)
    .eq("rol", "miembro");

  if (error) throw error;

  agendasCompartidasPropias = (data || [])
    .filter((membresia) => membresia.familias)
    .map((membresia) => ({
      id: membresia.familias.id,
      nombre: membresia.familias.nombre,
    }));

  panelPermisoPropio.hidden = agendasCompartidasPropias.length === 0;
  if (agendasCompartidasPropias.length === 0) return;

  selectorAgendaPermisoPropio.replaceChildren();
  agendasCompartidasPropias.forEach((agenda) => {
    selectorAgendaPermisoPropio.add(new Option(agenda.nombre, agenda.id));
  });
  await cargarAdultosParaPermisoPropio();
  ocultarEstadoInvitaciones();
}

async function cargarAdultosParaPermisoPropio() {
  const { data, error } = await clienteSupabase.rpc("obtener_miembros_compartidos", {
    familia_consultada: selectorAgendaPermisoPropio.value,
  });

  if (error) throw error;

  selectorAdultoPermisoPropio.replaceChildren();
  for (const adulto of data || []) {
    selectorAdultoPermisoPropio.add(new Option(adulto.email || "Otro adulto", adulto.usuario_id));
  }

  const hayAdulto = selectorAdultoPermisoPropio.options.length > 0;
  selectorAdultoPermisoPropio.disabled = !hayAdulto;
  casillaPermisoPropio.disabled = !hayAdulto;
  botonGuardarPermisoPropio.disabled = !hayAdulto;
  if (!hayAdulto) {
    mostrarMensajeInvitaciones(mensajePermisoPropio, "No encontramos otro adulto en esta agenda compartida.", true);
    return;
  }
  await cargarMiPermisoEdicion();
}

async function cargarMiPermisoEdicion() {
  limpiarMensajeInvitaciones(mensajePermisoPropio);
  const { data, error } = await clienteSupabase.rpc("obtener_mi_permiso_edicion", {
    familia_consultada: selectorAgendaPermisoPropio.value,
    usuario_editor: selectorAdultoPermisoPropio.value,
  });

  if (error) {
    console.error("No se pudo cargar tu permiso de edición:", error);
    mostrarMensajeInvitaciones(mensajePermisoPropio, "No hemos podido cargar tu permiso. Comprueba que esté aplicada la migración 039.", true);
    casillaPermisoPropio.disabled = true;
    botonGuardarPermisoPropio.disabled = true;
    return;
  }

  casillaPermisoPropio.disabled = false;
  botonGuardarPermisoPropio.disabled = false;
  casillaPermisoPropio.checked = data === true;
}

async function guardarMiPermisoEdicion() {
  limpiarMensajeInvitaciones(mensajePermisoPropio);
  botonGuardarPermisoPropio.disabled = true;
  const { data, error } = await clienteSupabase.rpc("configurar_mi_permiso_edicion", {
    familia_consultada: selectorAgendaPermisoPropio.value,
    usuario_editor: selectorAdultoPermisoPropio.value,
    permite_editar: casillaPermisoPropio.checked,
  });
  botonGuardarPermisoPropio.disabled = false;

  if (error || data !== true) {
    console.error("No se pudo guardar tu permiso de edición:", error);
    mostrarMensajeInvitaciones(mensajePermisoPropio, "No se pudo guardar el permiso. Inténtalo de nuevo.", true);
    return;
  }

  mostrarMensajeInvitaciones(mensajePermisoPropio, "Permiso guardado. El otro adulto tendrá que recargar Atempo para ver el cambio.");
}

function actualizarEstadoCasillaEdicion(contenedorPerfiles, casillaEdicion) {
  const hayPerfilesSeleccionados = contenedorPerfiles.querySelector("input:checked") !== null;
  casillaEdicion.disabled = !hayPerfilesSeleccionados;
  if (!hayPerfilesSeleccionados) casillaEdicion.checked = false;
}

function unirNombresEnFrase(nombres) {
  if (nombres.length < 2) return nombres[0] || "";
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

function actualizarResumenInvitacion() {
  const idsSeleccionados = new Set(
    [...listaPerfilesInvitacion.querySelectorAll("input:checked")].map((casilla) => casilla.value)
  );
  const nombresSeleccionados = perfilesAgendaInvitaciones
    .filter((perfil) => idsSeleccionados.has(perfil.id))
    .map((perfil) => perfil.nombre);

  resumenPerfilesInvitacion.textContent = nombresSeleccionados.length
    ? `Compartirás: ${unirNombresEnFrase(nombresSeleccionados)}.`
    : "Aún no has seleccionado ninguna persona para compartir.";
  resumenEdicionInvitacion.textContent = casillaEdicionInvitacion.checked
    ? "La persona invitada podrá editar las actividades compartidas que hayas creado."
    : "La persona invitada podrá verlas, pero no editar las actividades compartidas que hayas creado.";
}

async function cargarPermisosMiembro() {
  const usuarioId = selectorMiembroPermisos.value;
  if (!usuarioId) return;

  const [resultadoPerfiles, resultadoEdicion] = await Promise.all([
    clienteSupabase.rpc("obtener_perfiles_compartidos_miembro", {
      familia_consultada: selectorAgendaInvitaciones.value,
      usuario_consultado: usuarioId,
    }),
    clienteSupabase.rpc("obtener_permiso_edicion_miembro", {
      familia_consultada: selectorAgendaInvitaciones.value,
      usuario_consultado: usuarioId,
    }),
  ]);

  if (resultadoPerfiles.error) {
    console.error("No se pudieron cargar los perfiles visibles del miembro:", resultadoPerfiles.error);
    mostrarMensajeInvitaciones(mensajePermisosMiembros, "No hemos podido cargar las personas que puede ver este adulto.", true);
    return;
  }

  renderizarCasillasPerfiles(listaPerfilesPermisos, perfilesAgendaInvitaciones, resultadoPerfiles.data || []);
  if (resultadoEdicion.error) {
    console.error("No se pudo cargar el permiso de edición del miembro:", resultadoEdicion.error);
    casillaEdicionMiembro.checked = false;
    casillaEdicionMiembro.disabled = true;
    botonGuardarPermisos.disabled = true;
    mostrarMensajeInvitaciones(
      mensajePermisosMiembros,
      "Las personas visibles sí se han cargado. Para gestionar también el permiso de edición, primero hay que aplicar en Supabase la migración 038.",
      true
    );
    return;
  }

  casillaEdicionMiembro.checked = resultadoEdicion.data === true;
  botonGuardarPermisos.disabled = false;
  actualizarEstadoCasillaEdicion(listaPerfilesPermisos, casillaEdicionMiembro);
  limpiarMensajeInvitaciones(mensajePermisosMiembros);
}

async function guardarPermisosMiembro() {
  limpiarMensajeInvitaciones(mensajePermisosMiembros);
  const perfilesSeleccionados = [...listaPerfilesPermisos.querySelectorAll("input:checked")]
    .map((casilla) => casilla.value);

  botonGuardarPermisos.disabled = true;
  const { data, error } = await clienteSupabase.rpc("configurar_permisos_miembro", {
    familia_consultada: selectorAgendaInvitaciones.value,
    usuario_destino: selectorMiembroPermisos.value,
    perfiles_compartidos: perfilesSeleccionados,
    permite_editar_actividades: casillaEdicionMiembro.checked,
  });
  botonGuardarPermisos.disabled = false;

  if (error || data !== true) {
    console.error("No se pudieron guardar los permisos:", error);
    mostrarMensajeInvitaciones(mensajePermisosMiembros, "No se pudieron guardar los permisos. Inténtalo de nuevo.", true);
    return;
  }

  mostrarMensajeInvitaciones(mensajePermisosMiembros, "Permisos guardados. La otra cuenta tendrá que recargar Atempo para ver el cambio.");
}

async function mostrarPanelCrearInvitacion(usuario) {
  try {
    const agendas = await cargarAgendasParaInvitar(usuario.id);
    panelCrearInvitacion.hidden = false;
    panelAccesoInvitaciones.hidden = true;
    ocultarEstadoInvitaciones();
    if (agendas.length === 1) {
      selectorAgendaInvitaciones.disabled = true;
    }
  } catch (error) {
    console.error("No se pudieron cargar las agendas para invitar:", error);
    mostrarEstadoInvitaciones(
      "No hemos podido cargar tus agendas. Vuelve a Atempo e inténtalo de nuevo."
    );
  }
}

async function generarInvitacion(evento) {
  evento.preventDefault();
  limpiarMensajeInvitaciones(mensajeCrearInvitacion);
  contenedorEnlaceGenerado.hidden = true;
  botonGenerarInvitacion.disabled = true;
  botonGenerarInvitacion.textContent = "Creando enlace…";

  const perfilesSeleccionados = [...listaPerfilesInvitacion.querySelectorAll("input:checked")]
    .map((casilla) => casilla.value);
  if (perfilesSeleccionados.length === 0) {
    botonGenerarInvitacion.disabled = false;
    botonGenerarInvitacion.textContent = "Crear enlace de invitación";
    mostrarMensajeInvitaciones(mensajeCrearInvitacion, "Selecciona al menos un perfil para compartir.", true);
    return;
  }

  const { data, error } = await clienteSupabase.rpc("crear_invitacion_familia", {
    familia_consultada: selectorAgendaInvitaciones.value,
    correo_invitado: correoInvitado.value.trim(),
    perfiles_compartidos: perfilesSeleccionados,
    permite_editar_actividades: casillaEdicionInvitacion.checked,
  });

  botonGenerarInvitacion.disabled = false;
  botonGenerarInvitacion.textContent = "Crear enlace de invitación";

  if (error || !data?.token) {
    console.error("No se pudo crear la invitación:", error);
    mostrarMensajeInvitaciones(
      mensajeCrearInvitacion,
      error?.code === "PGRST202"
        ? "La base de datos aún no tiene activada la función de invitaciones. No se ha creado ningún enlace."
        : "No hemos podido crear el enlace. Comprueba los datos e inténtalo de nuevo.",
      true
    );
    return;
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("token", data.token);
  campoEnlaceGenerado.value = url.toString();
  contenedorEnlaceGenerado.hidden = false;
  mostrarMensajeInvitaciones(
    mensajeCrearInvitacion,
    `Enlace creado. Es válido hasta el ${new Date(data.expires_at).toLocaleDateString("es-ES")}.`
  );
}

async function copiarEnlaceInvitacion() {
  try {
    await navigator.clipboard.writeText(campoEnlaceGenerado.value);
    botonCopiarInvitacion.textContent = "Enlace copiado";
  } catch (error) {
    campoEnlaceGenerado.focus();
    campoEnlaceGenerado.select();
    mostrarMensajeInvitaciones(
      mensajeCrearInvitacion,
      "Selecciona el enlace y cópialo con la opción Copiar del dispositivo."
    );
  }
}

async function aceptarInvitacion(evento) {
  evento.preventDefault();
  limpiarMensajeInvitaciones(mensajeAceptarInvitacion);
  botonAceptarInvitacion.disabled = true;
  botonAceptarInvitacion.textContent = "Uniendo agendas…";

  const { data: usuarioData, error: errorUsuario } = await clienteSupabase.auth.getUser();
  if (errorUsuario || !usuarioData.user) {
    mostrarMensajeInvitaciones(mensajeAceptarInvitacion, "Inicia sesión para aceptar la invitación.", true);
    botonAceptarInvitacion.disabled = false;
    botonAceptarInvitacion.textContent = "Aceptar invitación";
    return;
  }

  const { data: familiaId, error } = await clienteSupabase.rpc("aceptar_invitacion_familia", {
    token_invitacion: tokenInvitacion,
    nombre_adulto: document.querySelector("#nombre-adulto-invitacion").value.trim(),
    icono_adulto: document.querySelector("#icono-adulto-invitacion").value,
    color_adulto: document.querySelector("#color-adulto-invitacion").value,
  });

  if (error || !familiaId) {
    console.error("No se pudo aceptar la invitación:", error);
    mostrarMensajeInvitaciones(
      mensajeAceptarInvitacion,
      error?.code === "PGRST202"
        ? "La base de datos aún no tiene activada la función para aceptar invitaciones."
        : error?.message || "No hemos podido aceptar la invitación. Comprueba que el enlace sigue activo.",
      true
    );
    botonAceptarInvitacion.disabled = false;
    botonAceptarInvitacion.textContent = "Aceptar invitación";
    return;
  }

  localStorage.setItem(`atempo-agenda-activa:${usuarioData.user.id}`, familiaId);
  window.history.replaceState({}, "", window.location.pathname);
  window.location.replace(new URL("index.html", window.location.href).toString());
}

async function prepararPaginaInvitaciones() {
  mostrarEstadoInvitaciones("Comprobando tu cuenta…");
  const { data, error } = await clienteSupabase.auth.getSession();

  if (error || !data.session) {
    mostrarFormularioAccesoInvitaciones();
    return;
  }

  if (tokenInvitacion) {
    panelAccesoInvitaciones.hidden = true;
    panelAceptarInvitacion.hidden = false;
    ocultarEstadoInvitaciones();
    return;
  }

  await mostrarPanelCrearInvitacion(data.session.user);
  try {
    await mostrarPanelPermisoPropio(data.session.user);
  } catch (error) {
    console.error("No se pudo cargar el permiso de edición propio:", error);
    if (!panelPermisoPropio.hidden) {
      mostrarMensajeInvitaciones(mensajePermisoPropio, "No hemos podido cargar este permiso. Comprueba que esté aplicada la migración 039.", true);
    }
  }
}

formularioAccesoInvitaciones.addEventListener("submit", iniciarSesionInvitaciones);
botonCrearCuentaInvitaciones.addEventListener("click", crearCuentaDesdeInvitacion);
formularioCrearInvitacion.addEventListener("submit", generarInvitacion);
botonCopiarInvitacion.addEventListener("click", copiarEnlaceInvitacion);
formularioAceptarInvitacion.addEventListener("submit", aceptarInvitacion);
selectorAgendaInvitaciones.addEventListener("change", async function () {
  casillaEdicionInvitacion.checked = false;
  actualizarResumenInvitacion();
  try {
    await cargarPerfilesAgenda(selectorAgendaInvitaciones.value);
    await cargarMiembrosAgenda(selectorAgendaInvitaciones.value);
  } catch (error) {
    console.error("No se pudo actualizar la agenda para compartir:", error);
    mostrarMensajeInvitaciones(mensajeCrearInvitacion, "No hemos podido cargar los perfiles de esta agenda.", true);
  }
});
selectorMiembroPermisos.addEventListener("change", cargarPermisosMiembro);
botonGuardarPermisos.addEventListener("click", guardarPermisosMiembro);
selectorAgendaPermisoPropio.addEventListener("change", cargarAdultosParaPermisoPropio);
selectorAdultoPermisoPropio.addEventListener("change", cargarMiPermisoEdicion);
botonGuardarPermisoPropio.addEventListener("click", guardarMiPermisoEdicion);
listaPerfilesInvitacion.addEventListener("change", function () {
  actualizarEstadoCasillaEdicion(listaPerfilesInvitacion, casillaEdicionInvitacion);
  actualizarResumenInvitacion();
});
casillaEdicionInvitacion.addEventListener("change", actualizarResumenInvitacion);
listaPerfilesPermisos.addEventListener("change", function () {
  actualizarEstadoCasillaEdicion(listaPerfilesPermisos, casillaEdicionMiembro);
});

prepararPaginaInvitaciones();
