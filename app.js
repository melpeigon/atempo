
const personas = [];

// Devolver fecha actual //

const fechaHoy = document.querySelector("#fecha-hoy");


const ahora = new Date();
const fechaBonita = ahora.toLocaleDateString("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});


fechaHoy.textContent = fechaBonita;

// boton añadir personas //

const botonPersona = document.querySelector("[data-action='add-person']");
const emergenteNuevaPersona = document.querySelector("#emergente-nueva-persona");
const botonCerrarEmergente = document.querySelector("[data-action='cerrar-dialogo-persona']");
const formularioNuevaPersona = document.querySelector("#formulario-nueva-persona");

function abrirEmergenteNuevaPersona() {

  emergenteNuevaPersona.showModal();
}

function cerrarEmergenteNuevaPersona() {
  emergenteNuevaPersona.close();
}
// formulario de añadir nueva persona//

function guardarNuevaPersona(evento) {
  evento.preventDefault();

  const datosFormulario = new FormData(formularioNuevaPersona);

  const nuevaPersona = {
    nombre: datosFormulario.get("nombre"),
    color: datosFormulario.get("color"),
    icono: datosFormulario.get("icono"),
  };

  personas.push(nuevaPersona);

  console.log("Personas guardadas:", personas);

}

botonPersona.addEventListener("click", abrirEmergenteNuevaPersona);
botonCerrarEmergente.addEventListener("click", cerrarEmergenteNuevaPersona);
formularioNuevaPersona.addEventListener("submit", guardarNuevaPersona);

