// Bienvenida e instalación de Atempo

const pantallaInstalacion = document.querySelector("#pantalla-instalacion");
const instalacionAndroid = document.querySelector("#instalacion-android");
const instruccionesIphone = document.querySelector("#instrucciones-iphone");
const botonInstalar = document.querySelector("#boton-instalar");
const mensajeInstalacion = document.querySelector("#mensaje-instalacion");

let avisoInstalacionAndroid = null;

function comprobarSiEstaInstalada() {
  const instaladaComoAplicacion = window.matchMedia("(display-mode: standalone)").matches;
  const instaladaEnIphone = window.navigator.standalone === true;
  const instalacionRecordada = localStorage.getItem("atempoInstalada") === "true";

  return instaladaComoAplicacion || instaladaEnIphone || instalacionRecordada;
}

function comprobarSiEsAndroid() {
  return /android/i.test(navigator.userAgent);
}

function comprobarSiEsIphone() {
  const dispositivoIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const ipadModerno = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return dispositivoIos || ipadModerno;
}

function mostrarInstruccionesIphone() {
  if (comprobarSiEstaInstalada()) {
    return;
  }

  pantallaInstalacion.hidden = false;
  instruccionesIphone.hidden = false;
}

async function instalarAtempo() {
  if (!avisoInstalacionAndroid) {
    return;
  }

  const resultado = await avisoInstalacionAndroid.prompt();

  avisoInstalacionAndroid = null;

  if (resultado.outcome === "accepted") {
    botonInstalar.textContent = "Instalando Atempo…";
    botonInstalar.disabled = true;
    mensajeInstalacion.textContent =
      "Cuando termine, abre Atempo desde el nuevo icono de tu pantalla de inicio.";
    mensajeInstalacion.hidden = false;
  } else {
    pantallaInstalacion.hidden = true;
  }

  console.log("Resultado de la instalación:", resultado.outcome);
}

window.addEventListener("beforeinstallprompt", function (evento) {
  evento.preventDefault();

  if (comprobarSiEstaInstalada()) {
    return;
  }

  avisoInstalacionAndroid = evento;
  pantallaInstalacion.hidden = false;
  instalacionAndroid.hidden = false;
  botonInstalar.textContent = "Instalar Atempo";
  botonInstalar.disabled = false;
});

window.addEventListener("appinstalled", function () {
  localStorage.setItem("atempoInstalada", "true");
  avisoInstalacionAndroid = null;
  botonInstalar.hidden = true;
  mensajeInstalacion.textContent =
    "Atempo ya está instalada. Ábrela desde el nuevo icono de tu pantalla de inicio.";
  mensajeInstalacion.hidden = false;
});

botonInstalar.addEventListener("click", instalarAtempo);

if (comprobarSiEsIphone()) {
  mostrarInstruccionesIphone();
}

if (comprobarSiEsAndroid() && !comprobarSiEstaInstalada()) {
  pantallaInstalacion.hidden = false;
  instalacionAndroid.hidden = false;
  botonInstalar.textContent = "Preparando instalación…";
  botonInstalar.disabled = true;

  setTimeout(function () {
    if (!avisoInstalacionAndroid) {
      pantallaInstalacion.hidden = true;
    }
  }, 3000);
}
