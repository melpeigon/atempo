// Inicio y cierre de sesión

const pantallaAcceso = document.querySelector("#pantalla-acceso");
const formularioAcceso = document.querySelector("#formulario-acceso");
const mensajeAcceso = document.querySelector("#mensaje-acceso");
const botonIniciarSesion = document.querySelector("#boton-iniciar-sesion");
const botonCrearCuenta = document.querySelector("#boton-crear-cuenta");
const botonCerrarSesion = document.querySelector("#boton-cerrar-sesion");
const avisoRegresoBienvenida = document.querySelector("#aviso-regreso-bienvenida");
const botonRegresoBienvenida = document.querySelector("#boton-regreso-bienvenida");
const campoContrasena = document.querySelector("#contrasena-acceso");
const botonMostrarContrasena = document.querySelector("#boton-mostrar-contrasena");
const tituloAcceso = document.querySelector("#titulo-acceso");
const subtituloAcceso = document.querySelector("#subtitulo-acceso");
const campoCorreo = document.querySelector("#correo-acceso");
const botonRecuperarContrasena = document.querySelector(
  "#boton-recuperar-contrasena"
);
const formularioNuevaContrasena = document.querySelector(
  "#formulario-nueva-contrasena"
);
const campoNuevaContrasena = document.querySelector("#nueva-contrasena");
const campoConfirmarNuevaContrasena = document.querySelector(
  "#confirmar-nueva-contrasena"
);
const mensajeNuevaContrasena = document.querySelector(
  "#mensaje-nueva-contrasena"
);
const botonGuardarNuevaContrasena = document.querySelector(
  "#boton-guardar-nueva-contrasena"
);

const URL_ATEMPO = "https://melpeigon.github.io/atempo/";
let recuperandoContrasena =
  window.location.hash.includes("type=recovery") ||
  new URLSearchParams(window.location.search).get("type") === "recovery";

let familiaActual = null;
let familiasUsuario = [];

function mostrarMensajeAcceso(mensaje, esError = true) {
  mensajeAcceso.textContent = mensaje;
  mensajeAcceso.classList.toggle("mensaje-correcto", !esError);
  mensajeAcceso.hidden = false;
}

function ocultarErrorAcceso() {
  mensajeAcceso.textContent = "";
  mensajeAcceso.classList.remove("mensaje-correcto");
  mensajeAcceso.hidden = true;
}

function mostrarMensajeNuevaContrasena(mensaje, esError = true) {
  mensajeNuevaContrasena.textContent = mensaje;
  mensajeNuevaContrasena.classList.toggle("mensaje-correcto", !esError);
  mensajeNuevaContrasena.hidden = false;
}

function ocultarMensajeNuevaContrasena() {
  mensajeNuevaContrasena.textContent = "";
  mensajeNuevaContrasena.classList.remove("mensaje-correcto");
  mensajeNuevaContrasena.hidden = true;
}

function mostrarFormularioNuevaContrasena() {
  recuperandoContrasena = true;
  tituloAcceso.textContent = "Elige una nueva contraseña.";
  subtituloAcceso.textContent = "Que sea fácil para ti y difícil para los demás.";
  formularioAcceso.hidden = true;
  formularioNuevaContrasena.hidden = false;
  pantallaAcceso.hidden = false;
  campoNuevaContrasena.focus();
}

function obtenerMensajeErrorRegistro(error) {
  if (error.code === "over_email_send_rate_limit") {
    return "Se han enviado demasiados correos en poco tiempo. Espera unos minutos y vuelve a intentarlo.";
  }

  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return "Ya existe una cuenta con este correo. Prueba a entrar con tu contraseña.";
  }

  if (error.code === "weak_password") {
    return "La contraseña es demasiado sencilla. Prueba con una más larga y segura.";
  }

  return "No hemos podido crear la cuenta. Comprueba el correo y usa una contraseña de al menos 6 caracteres.";
}

function cambiarVisibilidadContrasena() {
  const estaVisible = campoContrasena.type === "text";

  campoContrasena.type = estaVisible ? "password" : "text";
  botonMostrarContrasena.setAttribute("aria-pressed", String(!estaVisible));
  botonMostrarContrasena.setAttribute(
    "aria-label",
    estaVisible ? "Mostrar contraseña" : "Ocultar contraseña"
  );
}

async function crearFamiliaInicial() {
  const { error } = await clienteSupabase.rpc("crear_familia", {
    nombre_familia: "Mi familia",
  });

  if (error) {
    console.log("No se pudo crear la familia:", error);
    registrarErrorApp("Crear familia inicial", error);
    return false;
  }

  return true;
}

async function obtenerFamiliasUsuario() {
  const { data: datosUsuario, error: errorUsuario } =
    await clienteSupabase.auth.getUser();

  if (errorUsuario || !datosUsuario.user) {
    return { familias: [], usuarioId: null, correo: null, nombreVisible: null, error: errorUsuario };
  }

  const { data, error } = await clienteSupabase
    .from("miembros_familia")
    .select("familia_id, rol, familias!miembros_familia_familia_id_fkey(id, nombre)")
    .eq("usuario_id", datosUsuario.user.id);

  if (error) {
    return {
      familias: [],
      usuarioId: datosUsuario.user.id,
      correo: datosUsuario.user.email,
      nombreVisible: datosUsuario.user.user_metadata?.nombre_visible || null,
      error,
    };
  }

  const familias = data
    .filter(function (membresia) { return membresia.familias; })
    .map(function (membresia) {
      return {
        id: membresia.familias.id,
        nombre: membresia.familias.nombre,
        rol: membresia.rol,
      };
    });

  return {
    familias,
    usuarioId: datosUsuario.user.id,
    correo: datosUsuario.user.email,
    nombreVisible: datosUsuario.user.user_metadata?.nombre_visible || null,
    error: null,
  };
}

async function cargarFamiliaActual(permitirCrearFamilia = true) {
  const resultadoFamilias = await obtenerFamiliasUsuario();
  actualizarBienvenidaUsuario(resultadoFamilias.nombreVisible || resultadoFamilias.correo);

  if (resultadoFamilias.error) {
    console.log("No se pudieron cargar las agendas:", resultadoFamilias.error);
    registrarErrorApp("Cargar agendas", resultadoFamilias.error);
    mostrarMensajeAcceso("No hemos podido cargar tu familia.");
    pantallaAcceso.hidden = false;
    return false;
  }

  familiasUsuario = resultadoFamilias.familias;

  if (familiasUsuario.length === 0) {
    if (!permitirCrearFamilia) {
      mostrarMensajeAcceso("No hemos podido preparar tu familia.");
      pantallaAcceso.hidden = false;
      return false;
    }

    const familiaCreada = await crearFamiliaInicial();

    if (!familiaCreada) {
      mostrarMensajeAcceso("No hemos podido preparar tu familia.");
      pantallaAcceso.hidden = false;
      return false;
    }

    return cargarFamiliaActual(false);
  }

  // La pantalla reúne todas las agendas consultables; la agenda propia queda
  // como contexto para crear perfiles nuevos.
  familiaActual = familiasUsuario.find((familia) => familia.rol === "propietaria")
    || familiasUsuario[0];
  console.log("Familia conectada:", familiaActual.nombre);

  const datosCargados = await cargarDatosDeSupabase();

  if (!datosCargados) {
    mostrarMensajeAcceso("No hemos podido cargar los datos de tu agenda.");
    pantallaAcceso.hidden = false;
    return false;
  }

  await registrarAperturaUsuario();
  await cargarConfiguracionNotificaciones();
  await comprobarEstadoNotificacionesAlIniciar();

  return true;
}

async function prepararSesion() {
  ocultarErrorAcceso();

  const { data: usuarioAutenticado } = await clienteSupabase.auth.getUser();
  const metadatosUsuario = usuarioAutenticado.user?.user_metadata || {};
  const funcionBienvenida = new URLSearchParams(window.location.search).get("configurar");
  const abrirPersonasDesdeBienvenida = funcionBienvenida === "personas";
  const abrirNotificacionesDesdeBienvenida = funcionBienvenida === "notificaciones";
  const abrirActividadDesdeBienvenida = funcionBienvenida === "actividad";
  const abrirCompartirDesdeBienvenida = funcionBienvenida === "compartir";
  const abrirFuncionDesdeBienvenida = abrirPersonasDesdeBienvenida || abrirNotificacionesDesdeBienvenida || abrirActividadDesdeBienvenida || abrirCompartirDesdeBienvenida;
  const revisarBienvenida = new URLSearchParams(window.location.search).get("revisar") === "1";

  if (revisarBienvenida) sessionStorage.setItem("atempo-bienvenida-revision", "1");

  if (abrirPersonasDesdeBienvenida || abrirNotificacionesDesdeBienvenida || abrirActividadDesdeBienvenida || abrirCompartirDesdeBienvenida) {
    sessionStorage.setItem("atempo-bienvenida-regreso", funcionBienvenida);
  }

  if (metadatosUsuario.atempo_bienvenida_pendiente && !metadatosUsuario.atempo_bienvenida_completada && !abrirFuncionDesdeBienvenida) {
    window.location.replace(new URL("bienvenida.html", window.location.href).toString());
    return;
  }

  const familiaCargada = await cargarFamiliaActual();

  if (familiaCargada) {
    pantallaAcceso.hidden = true;
    avisoRegresoBienvenida.hidden = !sessionStorage.getItem("atempo-bienvenida-regreso");
    if (sessionStorage.getItem("atempo-bienvenida-revision") === "1") {
      avisoRegresoBienvenida.querySelector("p").textContent = "Cuando termines, puedes volver a revisar los primeros pasos.";
    }

    if (!abrirFuncionDesdeBienvenida) {
      await comprobarNovedadPendiente();
    }

    if (abrirFuncionDesdeBienvenida) {
      window.history.replaceState({}, "", window.location.pathname);
      if (abrirPersonasDesdeBienvenida) {
        abrirEmergenteNuevaPersona();
      } else if (abrirNotificacionesDesdeBienvenida) {
        botonCerrarNotificaciones.textContent = "Volver a la agenda";
        abrirConfiguracionNotificaciones();
      } else if (abrirActividadDesdeBienvenida) {
        abrirEmergenteNuevaActividad();
      } else if (abrirCompartirDesdeBienvenida) {
        if (revisarBienvenida) sessionStorage.setItem("atempo-bienvenida-revision", "1");
        window.location.replace(
          new URL(`invitaciones.html?desde=bienvenida&paso=compartir${revisarBienvenida ? "&revisar=1" : ""}`, window.location.href).toString()
        );
      }
    }
  }
}

botonRegresoBienvenida.addEventListener("click", function () {
  const paso = sessionStorage.getItem("atempo-bienvenida-regreso") || "personas";
  sessionStorage.removeItem("atempo-bienvenida-regreso");
  const revisar = sessionStorage.getItem("atempo-bienvenida-revision") === "1";
  window.location.href = new URL(`bienvenida.html?paso=${encodeURIComponent(paso)}${revisar ? "&revisar=1" : ""}`, window.location.href).toString();
});

async function iniciarSesion(evento) {
  evento.preventDefault();
  ocultarErrorAcceso();

  const datosFormulario = new FormData(formularioAcceso);

  botonIniciarSesion.disabled = true;
  botonIniciarSesion.textContent = "Entrando…";

  const { error } = await clienteSupabase.auth.signInWithPassword({
    email: datosFormulario.get("correo"),
    password: datosFormulario.get("contrasena"),
  });

  botonIniciarSesion.disabled = false;
  botonIniciarSesion.textContent = "Entrar";

  if (error) {
    console.log("No se pudo iniciar sesión:", error);
    mostrarMensajeAcceso("Revisa el correo y la contraseña.");
    return;
  }

  formularioAcceso.reset();
  await prepararSesion();
}

async function crearCuenta() {
  ocultarErrorAcceso();

  if (!formularioAcceso.reportValidity()) {
    return;
  }

  const datosFormulario = new FormData(formularioAcceso);

  botonCrearCuenta.disabled = true;
  botonCrearCuenta.textContent = "Creando tu cuenta…";

  const { data, error } = await clienteSupabase.auth.signUp({
    email: datosFormulario.get("correo"),
    password: datosFormulario.get("contrasena"),
    options: {
      emailRedirectTo: URL_ATEMPO,
      data: {
        atempo_bienvenida_pendiente: true,
        atempo_bienvenida_completada: false,
      },
    },
  });

  botonCrearCuenta.disabled = false;
  botonCrearCuenta.textContent = "Crear una cuenta";

  if (error) {
    console.log("No se pudo crear la cuenta:", error);
    mostrarMensajeAcceso(obtenerMensajeErrorRegistro(error));
    return;
  }

  if (!data.session) {
    formularioAcceso.reset();
    mostrarMensajeAcceso("Cuenta creada. Revisa tu correo para confirmarla y después vuelve para entrar.", false);
    return;
  }

  formularioAcceso.reset();
  await prepararSesion();
}

async function solicitarRecuperacionContrasena() {
  ocultarErrorAcceso();

  if (!campoCorreo.checkValidity()) {
    campoCorreo.reportValidity();
    return;
  }

  botonRecuperarContrasena.disabled = true;
  botonRecuperarContrasena.textContent = "Enviando…";

  const { error } = await clienteSupabase.auth.resetPasswordForEmail(
    campoCorreo.value.trim(),
    { redirectTo: URL_ATEMPO }
  );

  botonRecuperarContrasena.disabled = false;
  botonRecuperarContrasena.textContent = "He olvidado mi contraseña";

  if (error) {
    console.log("No se pudo solicitar el cambio de contraseña:", error);

    if (error.code === "over_email_send_rate_limit") {
      mostrarMensajeAcceso(
        "Se han enviado demasiados correos en poco tiempo. Espera un poco y vuelve a intentarlo."
      );
      return;
    }

    mostrarMensajeAcceso(
      "No hemos podido enviar el correo. Espera un momento y vuelve a intentarlo."
    );
    return;
  }

  mostrarMensajeAcceso(
    "Si existe una cuenta con ese correo, recibirás un enlace para elegir una contraseña nueva.",
    false
  );
}

async function guardarNuevaContrasena(evento) {
  evento.preventDefault();
  ocultarMensajeNuevaContrasena();

  if (campoNuevaContrasena.value !== campoConfirmarNuevaContrasena.value) {
    mostrarMensajeNuevaContrasena("Las dos contraseñas tienen que coincidir.");
    return;
  }

  botonGuardarNuevaContrasena.disabled = true;
  botonGuardarNuevaContrasena.textContent = "Guardando…";

  const { error } = await clienteSupabase.auth.updateUser({
    password: campoNuevaContrasena.value,
  });

  botonGuardarNuevaContrasena.disabled = false;
  botonGuardarNuevaContrasena.textContent = "Guardar nueva contraseña";

  if (error) {
    console.log("No se pudo actualizar la contraseña:", error);
    mostrarMensajeNuevaContrasena(
      "No hemos podido guardar la contraseña. Solicita un enlace nuevo y vuelve a intentarlo."
    );
    return;
  }

  await clienteSupabase.auth.signOut();

  recuperandoContrasena = false;
  formularioNuevaContrasena.reset();
  formularioNuevaContrasena.hidden = true;
  formularioAcceso.hidden = false;
  tituloAcceso.textContent = "Hola de nuevo.";
  subtituloAcceso.textContent = "Tu agenda familiar te espera.";
  window.history.replaceState({}, "", window.location.pathname);
  mostrarMensajeAcceso(
    "Contraseña actualizada. Ya puedes entrar con la nueva.",
    false
  );
}

async function cerrarSesion() {
  await retirarDispositivoAlCerrarSesion();
  await clienteSupabase.auth.signOut();

  familiaActual = null;
  familiasUsuario = [];
  vaciarDatosDeLaAgenda();
  pantallaAcceso.hidden = false;
  cerrarMenu();
}

async function comprobarSesionInicial() {
  if (recuperandoContrasena) {
    mostrarFormularioNuevaContrasena();
    return;
  }

  const { data, error } = await clienteSupabase.auth.getSession();

  if (error || !data.session) {
    pantallaAcceso.hidden = false;
    return;
  }

  await prepararSesion();
}

formularioAcceso.addEventListener("submit", iniciarSesion);
botonCrearCuenta.addEventListener("click", crearCuenta);
botonCerrarSesion.addEventListener("click", cerrarSesion);
botonMostrarContrasena.addEventListener("click", cambiarVisibilidadContrasena);
botonRecuperarContrasena.addEventListener(
  "click",
  solicitarRecuperacionContrasena
);
formularioNuevaContrasena.addEventListener("submit", guardarNuevaContrasena);

clienteSupabase.auth.onAuthStateChange(function (evento) {
  if (evento === "PASSWORD_RECOVERY") {
    mostrarFormularioNuevaContrasena();
  }
});

comprobarSesionInicial();
