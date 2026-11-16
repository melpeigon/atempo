const listaAdultosCompartidos = document.querySelector("#lista-adultos-compartidos");
const estadoAdultosCompartidos = document.querySelector("#estado-adultos-compartidos");
const botonCrearEnlaceCompartir = document.querySelector(".boton-compartir-agenda");
const tituloAdultosCompartidos = document.querySelector("#titulo-adultos-con-acceso");

let cargaCompartirEnCurso = false;

function mostrarEstadoCompartir(mensaje, esError = false) {
  listaAdultosCompartidos.replaceChildren();
  estadoAdultosCompartidos.textContent = mensaje;
  estadoAdultosCompartidos.classList.toggle("es-error", esError);
  estadoAdultosCompartidos.hidden = false;
  listaAdultosCompartidos.append(estadoAdultosCompartidos);
}

function crearFilaPerfilCompartido(perfil, marcado, deshabilitado = false) {
  const fila = document.createElement("label");
  fila.className = "fila-perfil-permisos";

  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.value = perfil.id;
  casilla.checked = marcado;
  casilla.disabled = deshabilitado;

  const nombre = document.createElement("span");
  nombre.textContent = perfil.nombre;

  const tipo = document.createElement("small");
  tipo.textContent = perfil.tipoPersona === "adulto" ? "Adulto" : "Infantil";

  fila.append(casilla, nombre, tipo);
  return fila;
}

function crearOpcionPermisoEdicion(nombreGrupo, valor, texto, marcado, deshabilitado = false) {
  const fila = document.createElement("label");
  fila.className = "opcion-permiso-edicion";

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = nombreGrupo;
  radio.value = String(valor);
  radio.checked = marcado;
  radio.disabled = deshabilitado;

  const etiqueta = document.createElement("span");
  etiqueta.textContent = texto;
  fila.append(radio, etiqueta);
  return fila;
}

function crearTarjetaAdultoCompartido(adulto, perfiles, idsVisibles, puedeEditar, puedoEditarSusPlanes, esPropietaria, familiaId) {
  const tarjeta = document.createElement("details");
  tarjeta.className = "tarjeta-adulto-compartido";
  tarjeta.dataset.usuarioId = adulto.usuario_id;

  const resumen = document.createElement("summary");
  resumen.className = "resumen-adulto-compartido";

  const iconoAdulto = document.createElement("span");
  iconoAdulto.className = "icono-adulto-compartido";
  iconoAdulto.setAttribute("aria-hidden", "true");
  iconoAdulto.textContent = (adulto.email || "A").trim().charAt(0).toUpperCase();

  const datosAdulto = document.createElement("span");
  datosAdulto.className = "datos-adulto-compartido";

  const correo = document.createElement("strong");
  correo.textContent = adulto.email || "Adulto de la agenda";

  const rolAdulto = document.createElement("small");
  rolAdulto.className = "rol-adulto-compartido";
  rolAdulto.textContent = adulto.rol === "propietaria" ? "Creó la agenda" : "Se unió a la agenda";

  const estadoPermiso = document.createElement("small");
  estadoPermiso.className = "estado-permiso-adulto";

  const contenido = document.createElement("div");
  contenido.className = "contenido-adulto-compartido";

  const grupoPerfiles = document.createElement("fieldset");
  grupoPerfiles.className = "grupo-perfiles-compartidos";
  const tituloPerfiles = document.createElement("legend");
  tituloPerfiles.textContent = esPropietaria
    ? "Personas que puede ver"
    : "Personas que puedes ver";
  grupoPerfiles.append(tituloPerfiles);

  const perfilesVisibles = esPropietaria
    ? idsVisibles
    : new Set(perfiles.map((perfil) => perfil.id));

  for (const perfil of perfiles) {
    grupoPerfiles.append(
      crearFilaPerfilCompartido(
        perfil,
        perfilesVisibles.has(perfil.id),
        !esPropietaria
      )
    );
  }

  if (perfiles.length === 0) {
    const sinPerfiles = document.createElement("p");
    sinPerfiles.className = "ayuda-permisos-compartir";
    sinPerfiles.textContent = esPropietaria
      ? "No hay perfiles disponibles para compartir."
      : "Esta persona todavía no te ha compartido ningún perfil.";
    grupoPerfiles.append(sinPerfiles);
  }

  const resumenPermisoRecibido = document.createElement("div");
  resumenPermisoRecibido.className = "resumen-permiso-recibido";
  const tituloPermisoRecibido = document.createElement("strong");
  tituloPermisoRecibido.textContent = "Lo que puedes hacer";
  const detallePermisoRecibido = document.createElement("p");
  detallePermisoRecibido.textContent = puedoEditarSusPlanes
    ? "Esta persona te permite editar los planes compartidos que ha añadido."
    : "Puedes ver los planes compartidos que esta persona ha añadido, pero no editarlos.";
  resumenPermisoRecibido.append(tituloPermisoRecibido, detallePermisoRecibido);

  const grupoEdicion = document.createElement("fieldset");
  grupoEdicion.className = "grupo-permisos-edicion";
  const tituloEdicion = document.createElement("legend");
  tituloEdicion.textContent = "Lo que tú permites sobre los planes que añades";
  grupoEdicion.append(tituloEdicion);

  const nombreGrupoRadios = `permiso-edicion-${adulto.usuario_id}`;
  const puedeEditarPlanes = crearOpcionPermisoEdicion(
    nombreGrupoRadios,
    true,
    "Puede verlos y editarlos",
    puedeEditar,
    !esPropietaria && perfiles.length === 0
  );
  const puedeEditarRadio = puedeEditarPlanes.querySelector("input");
  const puedeVerPlanes = crearOpcionPermisoEdicion(
    nombreGrupoRadios,
    false,
    "Puede verlos, pero no editarlos",
    !puedeEditar
  );

  if (esPropietaria) {
    grupoEdicion.append(puedeVerPlanes, puedeEditarPlanes);
  } else {
    grupoEdicion.append(puedeVerPlanes, puedeEditarPlanes);
  }

  const notaPermisos = document.createElement("p");
  notaPermisos.className = "ayuda-permisos-compartir";
  notaPermisos.textContent = esPropietaria
    ? "Este permiso se aplica a los planes compartidos que tú añades. La otra persona no puede borrar esos planes. También puede añadir sus propios planes en los perfiles que ve."
    : "Este permiso se aplica a los planes compartidos que tú añades. La otra persona no puede borrarlos. También puedes añadir tus propios planes en los perfiles que ves.";
  grupoEdicion.append(notaPermisos);

  const mensajeGuardado = document.createElement("p");
  mensajeGuardado.className = "mensaje-permisos-compartir";
  mensajeGuardado.setAttribute("role", "status");
  mensajeGuardado.hidden = true;

  const botonGuardar = document.createElement("button");
  botonGuardar.type = "button";
  botonGuardar.className = "boton-guardar-permisos-compartir";
  botonGuardar.textContent = "Guardar permisos";
  botonGuardar.disabled = !esPropietaria && perfiles.length === 0;

  contenido.append(grupoPerfiles, resumenPermisoRecibido, grupoEdicion, mensajeGuardado, botonGuardar);
  datosAdulto.append(correo, rolAdulto, estadoPermiso);
  resumen.append(iconoAdulto, datosAdulto);
  tarjeta.append(resumen, contenido);

  function actualizarResumen() {
    const cantidad = esPropietaria
      ? grupoPerfiles.querySelectorAll("input:checked").length
      : perfiles.length;
    const edicionActivada = grupoEdicion.querySelector('input[type="radio"]:checked')?.value === "true";
    const resumenPersonas = cantidad === 0
      ? "No tiene perfiles para ver"
      : `Puede ver ${cantidad} ${cantidad === 1 ? "persona" : "personas"}`;
    estadoPermiso.textContent = esPropietaria
      ? `${resumenPersonas} · ${edicionActivada ? "Puede editar tus planes añadidos" : "No puede editar tus planes añadidos"}`
      : `${cantidad === 0 ? "No tienes perfiles compartidos" : `Puedes ver ${cantidad} ${cantidad === 1 ? "persona" : "personas"}`} · ${edicionActivada ? "Le permites editar tus planes añadidos" : "No puede editar tus planes añadidos"}`;
  }

  function actualizarPermisoEdicionDisponible() {
    if (!esPropietaria) return;

    const hayPerfilesMarcados = grupoPerfiles.querySelector("input:checked") !== null;
    puedeEditarRadio.disabled = !hayPerfilesMarcados;
    if (!hayPerfilesMarcados) {
      puedeEditarRadio.checked = false;
      puedeVerPlanes.querySelector("input").checked = true;
    }
    actualizarResumen();
  }

  async function guardarPermisos() {
    botonGuardar.disabled = true;
    mensajeGuardado.classList.remove("es-error");
    mensajeGuardado.textContent = "Guardando…";
    mensajeGuardado.hidden = false;

    let resultado;
    if (esPropietaria) {
      const perfilesSeleccionados = [...grupoPerfiles.querySelectorAll("input:checked")]
        .map((casilla) => casilla.value);
      resultado = await clienteSupabase.rpc("configurar_permisos_miembro", {
        familia_consultada: familiaId,
        usuario_destino: adulto.usuario_id,
        perfiles_compartidos: perfilesSeleccionados,
        permite_editar_actividades: puedeEditarRadio.checked,
      });
    } else {
      resultado = await clienteSupabase.rpc("configurar_mi_permiso_edicion", {
        familia_consultada: familiaId,
        usuario_editor: adulto.usuario_id,
        permite_editar: puedeEditarRadio.checked,
      });
    }

    botonGuardar.disabled = false;
    if (resultado.error || resultado.data !== true) {
      console.error("No se pudieron guardar los permisos desde Compartir:", resultado.error);
      mensajeGuardado.textContent = "No se pudieron guardar los permisos. Inténtalo de nuevo.";
      mensajeGuardado.classList.add("es-error");
      return;
    }

    mensajeGuardado.textContent = "Permisos guardados. La otra cuenta tendrá que recargar Atempo para ver el cambio.";
    actualizarResumen();
  }

  grupoPerfiles.addEventListener("change", actualizarPermisoEdicionDisponible);
  grupoEdicion.addEventListener("change", actualizarResumen);
  botonGuardar.addEventListener("click", guardarPermisos);
  actualizarPermisoEdicionDisponible();

  return tarjeta;
}

async function crearGrupoPermisosAgenda(familia) {
  const esPropietaria = familia.rol === "propietaria";
  const { data: autoresEditables, error: errorAutores } = await clienteSupabase.rpc(
    "obtener_autores_editables",
    { familia_consultada: familia.id }
  );
  if (errorAutores) throw errorAutores;

  const autoresEditablesFamilia = new Set(autoresEditables || []);
  const { data: adultos, error: errorAdultos } = await clienteSupabase.rpc(
    "obtener_miembros_compartidos",
    { familia_consultada: familia.id }
  );
  if (errorAdultos) throw errorAdultos;
  if (!adultos?.length) return null;

  const grupo = document.createElement("section");
  grupo.className = "grupo-agenda-permisos";

  const tituloGrupo = document.createElement("h3");
  tituloGrupo.textContent = esPropietaria
    ? `Personas con acceso a ${familia.nombre}`
    : `Agenda compartida contigo · ${familia.nombre}`;
  grupo.append(tituloGrupo);

  const perfilesDisponibles = esPropietaria
    ? personas.filter((persona) =>
        persona.familiaId === familia.id
        && (
          persona.tipoPersona === "menor"
          || persona.usuarioId === null
          || persona.usuarioId === usuarioActualId
        )
      )
    : personas.filter((persona) =>
        persona.familiaId === familia.id && perfilesCompartiblesActividad.has(persona.id)
      );

  const tarjetas = await Promise.all(adultos.map(async (adulto) => {
    let idsVisibles = new Set();
    let puedeEditar = false;
    const puedoEditarSusPlanes = autoresEditablesFamilia.has(adulto.usuario_id);

    if (esPropietaria) {
      const [resultadoPerfiles, resultadoEdicion] = await Promise.all([
        clienteSupabase.rpc("obtener_perfiles_compartidos_miembro", {
          familia_consultada: familia.id,
          usuario_consultado: adulto.usuario_id,
        }),
        clienteSupabase.rpc("obtener_permiso_edicion_miembro", {
          familia_consultada: familia.id,
          usuario_consultado: adulto.usuario_id,
        }),
      ]);
      if (resultadoPerfiles.error) throw resultadoPerfiles.error;
      if (resultadoEdicion.error) throw resultadoEdicion.error;
      idsVisibles = new Set(resultadoPerfiles.data || []);
      puedeEditar = resultadoEdicion.data === true;
    } else {
      const { data, error } = await clienteSupabase.rpc("obtener_mi_permiso_edicion", {
        familia_consultada: familia.id,
        usuario_editor: adulto.usuario_id,
      });
      if (error) throw error;
      puedeEditar = data === true;
    }

    return crearTarjetaAdultoCompartido(
      adulto,
      perfilesDisponibles,
      idsVisibles,
      puedeEditar,
      puedoEditarSusPlanes,
      esPropietaria,
      familia.id
    );
  }));

  grupo.append(...tarjetas);
  return grupo;
}

async function cargarPantallaCompartir() {
  if (cargaCompartirEnCurso) return;
  cargaCompartirEnCurso = true;
  mostrarEstadoCompartir("Cargando permisos…");

  try {
    if (!familiasUsuario.length || !usuarioActualId) {
      botonCrearEnlaceCompartir.hidden = true;
      mostrarEstadoCompartir("Inicia sesión para consultar los permisos de la agenda.");
      return;
    }

    botonCrearEnlaceCompartir.hidden = !familiasUsuario.some(
      (familia) => familia.rol === "propietaria"
    );
    tituloAdultosCompartidos.textContent = "Personas y permisos";

    const grupos = await Promise.all(
      familiasUsuario.map((familia) => crearGrupoPermisosAgenda(familia))
    );
    const gruposConAdultos = grupos.filter(Boolean);

    if (gruposConAdultos.length === 0) {
      mostrarEstadoCompartir(
        botonCrearEnlaceCompartir.hidden
          ? "Todavía no formas parte de una agenda compartida con otro adulto."
          : "Todavía no compartes tu agenda con otro adulto. Cuando acepte tu invitación, aparecerá aquí."
      );
      return;
    }

    listaAdultosCompartidos.replaceChildren(...gruposConAdultos);
  } catch (error) {
    console.error("No se pudieron cargar los permisos de las agendas:", error);
    mostrarEstadoCompartir("No hemos podido cargar los permisos. Prueba de nuevo dentro de un momento.", true);
  } finally {
    cargaCompartirEnCurso = false;
  }
}
