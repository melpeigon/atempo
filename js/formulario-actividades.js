// Elementos del formulario de actividades

const botonAnadirActividad = document.querySelector("#boton-anadir-actividad");
const botonAnadirActividadPersona = document.querySelector("#boton-anadir-actividad-persona");

const botonCerrarActividad = document.querySelector("#boton-cerrar-actividad");
const emergenteNuevaActividad = document.querySelector("#emergente-nueva-actividad");
const formularioActividad = document.querySelector("#form-anadir-actividad");
const selectorPersonaActividad = document.querySelector("#elige-persona");
const selectorTipoActividad = document.querySelector("#elige-actividad");
const contenedorActividadPersonalizada = document.querySelector("#opciones-actividad-personalizada");
const campoNombreActividadPersonalizada = document.querySelector("#nombre-actividad-personalizada");
const selectorRecurrencia = document.querySelector("#elige-recurrencia");
const contenedorDias = document.querySelector("#opciones-semanales");
const campoFechaActividad = document.querySelector("#elige-fecha");
const avisoRecurrenciaMensual = document.querySelector("#aviso-recurrencia-mensual");
const selectorAviso = document.querySelector("#elige-aviso");
const contenedorHoraAviso = document.querySelector("#opciones-hora-aviso");
const campoHoraAviso = document.querySelector("#hora-aviso");
const mensajeErrorActividad = document.querySelector("#mensaje-error-actividad");
const tituloEmergenteActividad = document.querySelector("#titulo-emergente-nueva-actividad");
const botonGuardarActividad = document.querySelector("#boton-guardar-actividad");

let idActividadEnEdicion = null;

campoFechaActividad.min = `${anoActual}-${mesActual}-${diaActual}`;

function mostrarPersonasEnFormulario() {
  selectorPersonaActividad.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Elige una persona";
  opcionInicial.disabled = true;
  opcionInicial.selected = true;

  selectorPersonaActividad.append(opcionInicial);

  for (const persona of personas) {
    const opcionPersona = document.createElement("option");
    opcionPersona.value = persona.id;
    opcionPersona.textContent = persona.nombre;

    selectorPersonaActividad.append(opcionPersona);
  }
}

function cambiarOpcionesRecurrencia() {
  if (selectorRecurrencia.value === "semanal") {
    contenedorDias.hidden = false;
    marcarDiaDeFechaInicio();
  } else {
    contenedorDias.hidden = true;

    const diasMarcados = contenedorDias.querySelectorAll("input:checked");

    for (const dia of diasMarcados) {
      dia.checked = false;
    }
  }

  mostrarAvisoRecurrenciaMensual();
}

function mostrarAvisoRecurrenciaMensual() {
  const diaElegido = Number(campoFechaActividad.value.split("-")[2]);
  const necesitaAviso = selectorRecurrencia.value === "mensual" && diaElegido >= 29;

  avisoRecurrenciaMensual.hidden = !necesitaAviso;
}

function cambiarOpcionesAviso() {
  const usaHoraConcreta = selectorAviso.value === "hora-concreta";

  contenedorHoraAviso.hidden = !usaHoraConcreta;
  campoHoraAviso.required = usaHoraConcreta;

  if (!usaHoraConcreta) {
    campoHoraAviso.value = "";
  }
}

function cambiarOpcionesActividad() {
  const esPersonalizada = selectorTipoActividad.value === "personalizada";

  contenedorActividadPersonalizada.hidden = !esPersonalizada;
  campoNombreActividadPersonalizada.required = esPersonalizada;

  if (!esPersonalizada) {
    campoNombreActividadPersonalizada.value = "";
  }
}

function obtenerNombreDiaDeFecha(fecha) {
  const partesFecha = fecha.split("-");
  const ano = Number(partesFecha[0]);
  const mes = Number(partesFecha[1]) - 1;
  const dia = Number(partesFecha[2]);
  const fechaCompleta = new Date(ano, mes, dia);

  return nombresDiasSemana[fechaCompleta.getDay()];
}

function marcarDiaDeFechaInicio() {
  if (selectorRecurrencia.value !== "semanal") {
    return;
  }

  if (campoFechaActividad.value === "") {
    return;
  }

  const casillasDias = contenedorDias.querySelectorAll("input[name='dias']");

  for (const casilla of casillasDias) {
    casilla.checked = false;
  }

  const nombreDiaFecha = obtenerNombreDiaDeFecha(campoFechaActividad.value);
  const casillaDiaFecha = contenedorDias.querySelector(
    `input[value="${nombreDiaFecha}"]`
  );

  if (casillaDiaFecha) {
    casillaDiaFecha.checked = true;
  }
}

function abrirEmergenteNuevaActividad(idPersona = null) {
  idActividadEnEdicion = null;

  formularioActividad.reset();
  contenedorDias.hidden = true;
  contenedorActividadPersonalizada.hidden = true;
  campoNombreActividadPersonalizada.required = false;
  avisoRecurrenciaMensual.hidden = true;
  contenedorHoraAviso.hidden = true;
  campoHoraAviso.required = false;
  campoFechaActividad.min = `${anoActual}-${mesActual}-${diaActual}`;

  tituloEmergenteActividad.textContent = "Añade una actividad";
  botonGuardarActividad.textContent = "Guardar";

  ocultarErrorActividad();
  mostrarPersonasEnFormulario();

  if (idPersona !== null) {
    selectorPersonaActividad.value = idPersona;
  }

  emergenteNuevaActividad.showModal();
}

function cerrarEmergenteNuevaActividad() {
  emergenteNuevaActividad.close();
}

function mostrarErrorActividad(mensaje) {
  mensajeErrorActividad.textContent = mensaje;
  mensajeErrorActividad.hidden = false;
}

function ocultarErrorActividad() {
  mensajeErrorActividad.textContent = "";
  mensajeErrorActividad.hidden = true;
}

function editarActividadSeleccionada() {
  const actividadSeleccionada = actividades.find(function (actividad) {
    return actividad.id === idActividadSeleccionada;
  });

  if (!actividadSeleccionada) {
    return;
  }

  idActividadEnEdicion = actividadSeleccionada.id;

  formularioActividad.reset();
  campoFechaActividad.removeAttribute("min");
  ocultarErrorActividad();
  mostrarPersonasEnFormulario();

  formularioActividad.elements.persona.value =
    actividadSeleccionada.personaId;

  formularioActividad.elements.actividad.value =
    actividadSeleccionada.actividad;

  formularioActividad.elements.nombrePersonalizado.value =
    actividadSeleccionada.nombrePersonalizado || "";

  cambiarOpcionesActividad();

  formularioActividad.elements.fecha.value =
    actividadSeleccionada.fecha;

  formularioActividad.elements.hora.value =
    actividadSeleccionada.hora;

  formularioActividad.elements.recurrencia.value =
    actividadSeleccionada.recurrencia;

  formularioActividad.elements.recordatorio.value =
    actividadSeleccionada.recordatorio || "";

  const avisoGuardado = actividadSeleccionada.aviso || "sin-aviso";

  formularioActividad.elements.aviso.value =
    avisoGuardado === "a-la-hora" ? "sin-aviso" : avisoGuardado;

  formularioActividad.elements.horaAviso.value =
    actividadSeleccionada.horaAviso || "";

  formularioActividad.elements.incluirResumen.checked =
    actividadSeleccionada.incluirResumen !== false;

  cambiarOpcionesAviso();

  if (actividadSeleccionada.recurrencia === "semanal") {
    contenedorDias.hidden = false;

    const casillasDias = contenedorDias.querySelectorAll(
      "input[name='dias']"
    );

    for (const casilla of casillasDias) {
      casilla.checked = actividadSeleccionada.dias.includes(
        casilla.value
      );
    }
  } else {
    contenedorDias.hidden = true;
  }

  mostrarAvisoRecurrenciaMensual();

  tituloEmergenteActividad.textContent = "Editar actividad";
  botonGuardarActividad.textContent = "Guardar cambios";

  emergenteNuevaActividad.showModal();
}

async function guardarNuevaActividad(evento) {
  evento.preventDefault();

  ocultarErrorActividad();

  const datosFormulario = new FormData(formularioActividad);
  const recurrenciaElegida = datosFormulario.get("recurrencia");
  const diasElegidos = datosFormulario.getAll("dias");
  const avisoElegido = datosFormulario.get("aviso");
  const horaAvisoElegida = datosFormulario.get("horaAviso");
  const idDeActividadEditada = idActividadEnEdicion;

  if (avisoElegido === "hora-concreta" && horaAvisoElegida === "") {
    mostrarErrorActividad("Elige la hora a la que quieres recibir el aviso.");
    return;
  }

  if (
    avisoElegido === "hora-concreta" &&
    horaAvisoElegida > datosFormulario.get("hora")
  ) {
    mostrarErrorActividad("La hora del aviso debe ser anterior a la actividad.");
    return;
  }

  if (recurrenciaElegida === "semanal" && diasElegidos.length === 0) {
    mostrarErrorActividad("Elige al menos un día de la semana.");
    return;
  }

  if (recurrenciaElegida === "semanal") {
    const diaFechaInicio = obtenerNombreDiaDeFecha(
      datosFormulario.get("fecha")
    );

    if (!diasElegidos.includes(diaFechaInicio)) {
      mostrarErrorActividad(
        "El día de la fecha de inicio debe estar seleccionado."
      );
      return;
    }
  }

  const datosActividad = {
    personaId: datosFormulario.get("persona"),
    actividad: datosFormulario.get("actividad"),
    nombrePersonalizado: datosFormulario.get("nombrePersonalizado").trim(),
    fecha: datosFormulario.get("fecha"),
    hora: datosFormulario.get("hora"),
    recurrencia: recurrenciaElegida,
    dias: diasElegidos,
    aviso: avisoElegido,
    horaAviso: horaAvisoElegida,
    incluirResumen: datosFormulario.has("incluirResumen"),
    recordatorio: datosFormulario.get("recordatorio"),
  };

  const datosParaSupabase = convertirActividadParaSupabase(datosActividad);
  botonGuardarActividad.disabled = true;

  if (idActividadEnEdicion !== null) {
    const actividadExistente = actividades.find(function (actividad) {
      return actividad.id === idActividadEnEdicion;
    });

    if (!actividadExistente) {
      botonGuardarActividad.disabled = false;
      return;
    }

    const { data, error } = await clienteSupabase
      .from("actividades")
      .update(datosParaSupabase)
      .eq("id", actividadExistente.id)
      .select("*")
      .single();

    if (error) {
      console.log("No se pudo editar la actividad:", error);
      registrarErrorApp("Editar actividad", error);
      mostrarErrorActividad("No hemos podido guardar los cambios. Inténtalo otra vez.");
      botonGuardarActividad.disabled = false;
      return;
    }

    Object.assign(actividadExistente, convertirActividadDeSupabase(data));
  } else {
    const { data, error } = await clienteSupabase
      .from("actividades")
      .insert(datosParaSupabase)
      .select("*")
      .single();

    if (error) {
      console.log("No se pudo crear la actividad:", error);
      registrarErrorApp("Crear actividad", error);
      mostrarErrorActividad("No hemos podido añadir la actividad. Inténtalo otra vez.");
      botonGuardarActividad.disabled = false;
      return;
    }

    const nuevaActividad = convertirActividadDeSupabase(data);

    actividades.push(nuevaActividad);
  }

  botonGuardarActividad.disabled = false;

  renderizarActividadesDeHoy();
  mostrarMes();

  if (!fichaPersona.hidden && idPersonaSeleccionada !== null) {
    abrirFichaPersona(idPersonaSeleccionada, false);
  }

  formularioActividad.reset();
  contenedorDias.hidden = true;
  contenedorActividadPersonalizada.hidden = true;
  campoNombreActividadPersonalizada.required = false;
  avisoRecurrenciaMensual.hidden = true;
  contenedorHoraAviso.hidden = true;
  campoHoraAviso.required = false;

  cerrarEmergenteNuevaActividad();

  idActividadEnEdicion = null;

  if (idDeActividadEditada !== null) {
    abrirFichaActividad(
      idDeActividadEditada,
      origenFichaActividad,
      false,
      fechaOcurrenciaFichaActividad
    );
  }
}

botonAnadirActividad.addEventListener("click", function () {
  abrirEmergenteNuevaActividad();
});

botonAnadirActividadPersona.addEventListener("click", function () {
  abrirEmergenteNuevaActividad(idPersonaSeleccionada);
});
botonCerrarActividad.addEventListener("click", cerrarEmergenteNuevaActividad);
formularioActividad.addEventListener("submit", guardarNuevaActividad);
selectorRecurrencia.addEventListener("change", cambiarOpcionesRecurrencia);
selectorTipoActividad.addEventListener("change", cambiarOpcionesActividad);
selectorAviso.addEventListener("change", cambiarOpcionesAviso);
campoFechaActividad.addEventListener("change", marcarDiaDeFechaInicio);
campoFechaActividad.addEventListener("change", mostrarAvisoRecurrenciaMensual);
botonEditarActividad.addEventListener("click", editarActividadSeleccionada);
