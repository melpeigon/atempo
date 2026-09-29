// Inicio y cierre de sesión

const pantallaAcceso = document.querySelector("#pantalla-acceso");
const formularioAcceso = document.querySelector("#formulario-acceso");
const mensajeAcceso = document.querySelector("#mensaje-acceso");
const botonIniciarSesion = document.querySelector("#boton-iniciar-sesion");
const botonCrearCuenta = document.querySelector("#boton-crear-cuenta");
const botonCerrarSesion = document.querySelector("#boton-cerrar-sesion");

let familiaActual = null;

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

async function crearFamiliaInicial() {
  const { error } = await clienteSupabase.rpc("crear_familia", {
    nombre_familia: "Mi familia",
  });

  if (error) {
    console.log("No se pudo crear la familia:", error);
    return false;
  }

  return true;
}

async function cargarFamiliaActual(permitirCrearFamilia = true) {
  const { data, error } = await clienteSupabase
    .from("familias")
    .select("id, nombre")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("No se pudo cargar la familia:", error);
    mostrarMensajeAcceso("No hemos podido cargar tu familia.");
    pantallaAcceso.hidden = false;
    return false;
  }

  familiaActual = data;

  if (!familiaActual) {
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

  console.log("Familia conectada:", familiaActual.nombre);

  const datosCargados = await cargarDatosDeSupabase();

  if (!datosCargados) {
    mostrarMensajeAcceso("No hemos podido cargar los datos de tu agenda.");
    pantallaAcceso.hidden = false;
    return false;
  }

  return true;
}

async function prepararSesion() {
  ocultarErrorAcceso();

  const familiaCargada = await cargarFamiliaActual();

  if (familiaCargada) {
    pantallaAcceso.hidden = true;
  }
}

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
  });

  botonCrearCuenta.disabled = false;
  botonCrearCuenta.textContent = "Crear una cuenta";

  if (error) {
    console.log("No se pudo crear la cuenta:", error);
    mostrarMensajeAcceso("No hemos podido crear la cuenta. Comprueba el correo y usa una contraseña de al menos 6 caracteres.");
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

async function cerrarSesion() {
  await clienteSupabase.auth.signOut();

  familiaActual = null;
  vaciarDatosDeLaAgenda();
  pantallaAcceso.hidden = false;
  cerrarMenu();
}

async function comprobarSesionInicial() {
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

comprobarSesionInicial();
