// Bienvenida e instalación de Atempo

const pantallaInstalacion = document.querySelector("#pantalla-instalacion");
const instalacionAndroid = document.querySelector("#instalacion-android");
const instruccionesIphone = document.querySelector("#instrucciones-iphone");
const botonInstalar = document.querySelector("#boton-instalar");

let avisoInstalacionAndroid = null;

function comprobarSiEstaInstalada() {
  const instaladaComoAplicacion = window.matchMedia("(display-mode: standalone)").matches;
  const instaladaEnIphone = window.navigator.standalone === true;

  return instaladaComoAplicacion || instaladaEnIphone;
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
  pantallaInstalacion.hidden = true;

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
});

window.addEventListener("appinstalled", function () {
  pantallaInstalacion.hidden = true;
  avisoInstalacionAndroid = null;
});

botonInstalar.addEventListener("click", instalarAtempo);

if (comprobarSiEsIphone()) {
  mostrarInstruccionesIphone();
}
