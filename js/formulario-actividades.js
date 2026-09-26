
const botonAnadirActividad = document.querySelector("#boton-anadir-actividad");
const botonCerrarActividad = document.querySelector("#boton-cerrar-actividad");

const emergenteNuevaActividad = document.querySelector("#emergente-nueva-actividad");

const selectorPersonaActividad = document.querySelector("#elige-persona");
const rutasIconosActividades = {
    musica: "Branding/iconos/SVG/musica.svg",
    catequesis: "Branding/iconos/SVG/catequesis.svg",
    futbol: "Branding/iconos/SVG/futbol.svg",
    cumple: "Branding/iconos/SVG/cumplea%C3%B1os.svg",
    peluqueria: "Branding/iconos/SVG/peluqueria.svg",
    dentista: "Branding/iconos/SVG/dentista.svg",
    ingles: "Branding/iconos/SVG/tarea.svg",
    padel: "Branding/iconos/SVG/pael.svg",
    gym: "Branding/iconos/SVG/gym.svg",
};
const nombresActividades = {
    musica: "Música",
    catequesis: "Catequesis",
    futbol: "Fútbol",
    cumple: "Cumpleaños",
    peluqueria: "Peluquería",
    dentista: "Dentista",
    ingles: "Inglés",
    padel: "Pádel",
    gym: "Gym",
};

const formularioActividad = document.querySelector("#form-anadir-actividad");

const actividadesGuardadas = localStorage.getItem("actividades");

const actividades = actividadesGuardadas
    ? JSON.parse(actividadesGuardadas)
    : [];

const selectorRecurrencia = document.querySelector("#elige-recurrencia");
const contenedorDias = document.querySelector("#opciones-semanales");


//limitar fecha a dia actual
const campoFechaActividad = document.querySelector("#elige-fecha");
const fechaActual = new Date();
const anoActual = fechaActual.getFullYear();
const mesActual = String(fechaActual.getMonth() + 1).padStart(2, "0");
const diaActual = String(fechaActual.getDate()).padStart(2, "0");

campoFechaActividad.min = `${anoActual}-${mesActual}-${diaActual}`;


const nombresDiasSemana = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
];

// mostrar planes hoy
const numeroPlanesHoy = document.querySelector("#numero-planes-hoy");
const mensajeSinPlanes = document.querySelector("#mensaje-sin-planes");
const listaActividadesHoy = document.querySelector("#lista-actividades-hoy");


const mensajeErrorActividad = document.querySelector("#mensaje-error-actividad");


//  Funciones para preparar o mostrar datos
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
}

function obtenerActividadesDeHoy() {
    const fechaHoyFormatoInput = `${anoActual}-${mesActual}-${diaActual}`;


    const nombreDiaHoy = nombresDiasSemana[fechaActual.getDay()];
    const numeroDiaHoy = fechaActual.getDate();

    const actividadesDeHoy = actividades.filter(function (actividad) {
        if (actividad.fecha > fechaHoyFormatoInput) {
            return false;
        }

        if (actividad.recurrencia === "puntual") {
            return actividad.fecha === fechaHoyFormatoInput;
        }

        if (actividad.recurrencia === "semanal") {
            return actividad.dias.includes(nombreDiaHoy);
        }

        if (actividad.recurrencia === "mensual") {
            const numeroDiaActividad = Number(actividad.fecha.split("-")[2]);
            return numeroDiaActividad === numeroDiaHoy;
        }

        return false;
    });

    return actividadesDeHoy;
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


// Funciones para abrir y cerrar

function abrirEmergenteNuevaActividad() {
    ocultarErrorActividad();
    mostrarPersonasEnFormulario();
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

function guardarNuevaActividad(evento) {
    evento.preventDefault();

    ocultarErrorActividad();

    const datosFormulario = new FormData(formularioActividad);
    const recurrenciaElegida = datosFormulario.get("recurrencia");
    const diasElegidos = datosFormulario.getAll("dias");

    if (recurrenciaElegida === "semanal" && diasElegidos.length === 0) {
        mostrarErrorActividad("Elige al menos un día de la semana.");
        return;
    }

    if (recurrenciaElegida === "semanal") {
        const diaFechaInicio = obtenerNombreDiaDeFecha(
            datosFormulario.get("fecha")
        );

        if (!diasElegidos.includes(diaFechaInicio)) {
            mostrarErrorActividad("El día de la fecha de inicio debe estar seleccionado.");
            return;
        }
    }

    const nuevaActividad = {
        id: crypto.randomUUID(),
        personaId: datosFormulario.get("persona"),
        actividad: datosFormulario.get("actividad"),
        fecha: datosFormulario.get("fecha"),
        hora: datosFormulario.get("hora"),
        recurrencia: recurrenciaElegida,
        dias: diasElegidos,
        recordatorio: datosFormulario.get("recordatorio"),
    };

    actividades.push(nuevaActividad);

    localStorage.setItem("actividades", JSON.stringify(actividades));

    console.log("Actividad guardada:", nuevaActividad);

    formularioActividad.reset();
    contenedorDias.hidden = true;

    renderizarActividadesDeHoy();
    cerrarEmergenteNuevaActividad();
}

function renderizarActividadesDeHoy() {
    const actividadesDeHoy = obtenerActividadesDeHoy();
    listaActividadesHoy.replaceChildren();

    if (actividadesDeHoy.length === 0) {
        mensajeSinPlanes.hidden = false;
    } else {
        mensajeSinPlanes.hidden = true;
    }

    if (actividadesDeHoy.length === 1) {
        numeroPlanesHoy.textContent = "1 Plan";
    } else {
        numeroPlanesHoy.textContent = `${actividadesDeHoy.length} Planes`;
    }
    actividadesDeHoy.sort(function (primeraActividad, segundaActividad) {
        return primeraActividad.hora.localeCompare(segundaActividad.hora);
    });

    //creacion de tarjetas
    for (const actividad of actividadesDeHoy) {
        const personaActividad = personas.find(function (persona) {
            return persona.id === actividad.personaId;
        });

        if (!personaActividad) {
            continue;
        }

        const tarjetaActividad = document.createElement("article");
        tarjetaActividad.classList.add("tarjeta-actividad");

        const bloqueHora = document.createElement("div");
        bloqueHora.classList.add("bloque-hora-actividad");

        const horaActividad = document.createElement("time");
        horaActividad.classList.add("hora-actividad");
        horaActividad.dateTime = actividad.hora;
        horaActividad.textContent = actividad.hora;

        const nombrePersonaActividad = document.createElement("span");
        nombrePersonaActividad.classList.add("nombre-persona-actividad");
        nombrePersonaActividad.textContent = personaActividad.nombre;

        bloqueHora.append(horaActividad, nombrePersonaActividad);

        const separadorActividad = document.createElement("div");
        separadorActividad.classList.add("separador-actividad");

        const contenedorIconoActividad = document.createElement("div");
        contenedorIconoActividad.classList.add("icono-actividad");
        contenedorIconoActividad.style.backgroundColor = personaActividad.color;

        const iconoActividad = document.createElement("img");
        iconoActividad.src = rutasIconosActividades[actividad.actividad];
        iconoActividad.alt = "";

        contenedorIconoActividad.append(iconoActividad);

        const informacionActividad = document.createElement("div");
        informacionActividad.classList.add("informacion-actividad");

        const tituloActividad = document.createElement("h3");
        tituloActividad.textContent = nombresActividades[actividad.actividad];

        informacionActividad.append(tituloActividad);

        if (actividad.recordatorio !== "") {
            const recordatorioActividad = document.createElement("p");
            recordatorioActividad.textContent = actividad.recordatorio;

            informacionActividad.append(recordatorioActividad);
        }

        tarjetaActividad.append(
            bloqueHora,
            separadorActividad,
            contenedorIconoActividad,
            informacionActividad
        );

        listaActividadesHoy.append(tarjetaActividad);
    }

}

botonAnadirActividad.addEventListener("click", abrirEmergenteNuevaActividad);
botonCerrarActividad.addEventListener("click", cerrarEmergenteNuevaActividad);
formularioActividad.addEventListener("submit", guardarNuevaActividad);
selectorRecurrencia.addEventListener("change", cambiarOpcionesRecurrencia);
campoFechaActividad.addEventListener("change", marcarDiaDeFechaInicio);

renderizarActividadesDeHoy();