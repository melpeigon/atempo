// Elementos de la guía de uso

const pantallaGuia = document.querySelector("#pantalla-guia");
const botonVolverGuia = document.querySelector("#boton-volver-guia");

function abrirGuia() {
  cerrarMenu();
  pantallaInicio.hidden = true;
  pantallaGuia.hidden = false;
  window.scrollTo(0, 0);
}

function volverAlMenuDesdeGuia() {
  pantallaGuia.hidden = true;
  pantallaInicio.hidden = false;
  emergenteMenu.showModal();
}

botonMenuGuia.addEventListener("click", abrirGuia);
botonVolverGuia.addEventListener("click", volverAlMenuDesdeGuia);
