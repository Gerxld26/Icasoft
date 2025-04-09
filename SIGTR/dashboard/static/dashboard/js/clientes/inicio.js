/*ASISTENCIA TÉCNICA*/
const modalAsistencia = document.getElementById('modalAsistencia');
const openModalAsistencia = document.getElementById('btnAsistencia');
const closeModalAsis = document.getElementById('closeModalAsis');

/*MONITOREO*/
const modalMonitoreo = document.getElementById('modalMonitoreo');
const openModalMonitoreo = document.getElementById('btnMonitoreo');
const closeModalbtn = document.getElementById('closeModal');

/*DIAGNÓSTICO*/
const modalDiagnostico = document.getElementById('modalDiagnostico');
const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagnostico = document.getElementById('closeModalDiagn');

/* ANTIVIRUS*/
const modalAntivirus = document.getElementById('modalAntivirus');
const openModalAntivirus = document.getElementById('btnAbrirModalAntivirus');
const closeModalAntivirus = document.getElementById('closeModalAnt');

/* MANTENIMIENTO */
const modalMantenimiento = document.getElementById('modalMantenimiento');
const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
const closeModalMantenimiento = document.getElementById('closeModalMant');

/* RECOMENDACIONES */
const modalRecomendaciones = document.getElementById('modalRecomendaciones');
const openModalRecomendaciones = document.getElementById('btnVerCompleto');
const closeModalRecomendaciones = document.getElementById('closeModalRecom');

/* CENTRO DE APRENDIZAJE*/
const modalAprendizaje = document.getElementById('modalAprendizaje');
const openModalAprendizaje = document.getElementById('btnCentro');
const closeModalAprendizaje = document.getElementById('closeModalAprendizaje');


/*click fuera del modal se cierre: */
window.addEventListener('click', function (event) {
    if (event.target == modalAsistencia) {
        modalAsistencia.style.display = 'none';
    } else if(event.target == modalMonitoreo) {
        modalMonitoreo.style.display = 'none';
    } else if (event.target == modalDiagnostico) {
        modalDiagnostico.style.display = 'none';
    } else if (event.target == modalAntivirus) {
        modalAntivirus.style.display = 'none';
    } else if (event.target == modalMantenimiento) {
        modalMantenimiento.style.display = 'none';
    } else if (event.target == modalRecomendaciones) {
        modalRecomendaciones.style.display = 'none';
    }else if(event.target == modalAprendizaje){
        modalAprendizaje.style.display = 'none';
    }
})

/* MODAL ASISTENCIA TÉCNICA*/
openModalAsistencia.addEventListener('click', function () {
    modalAsistencia.style.display = 'flex';
})
closeModalAsis.addEventListener('click', function () {
    modalAsistencia.style.display = 'none';
})

/*MODAL MONITOREO*/
openModalMonitoreo.addEventListener('click', function () {
    modalMonitoreo.style.display = 'flex';
})
closeModalbtn.addEventListener('click', function () {
    modalMonitoreo.style.display = 'none';
})
/*MODAL DIAGNÓSTICO*/
openModalDiagnostico.addEventListener('click', function () {
    modalDiagnostico.style.display = 'flex';
})
closeModalDiagnostico.addEventListener('click', function () {
    modalDiagnostico.style.display = 'none';
})

/*MODAL ANTIVIRUS*/
openModalAntivirus.addEventListener('click', function () {
    modalAntivirus.style.display = 'flex';
})
closeModalAntivirus.addEventListener('click', function () {
    modalAntivirus.style.display = 'none';
})

/*MODAL MANTENIMIENTO*/
openModalMantenimiento.addEventListener('click', function () {
    modalMantenimiento.style.display = 'flex';
})
closeModalMantenimiento.addEventListener('click', function () {
    modalMantenimiento.style.display = 'none';
})

/*MODALRECOMENDACIONES*/
openModalRecomendaciones.addEventListener('click', function () {
    modalRecomendaciones.style.display = 'flex';
})
closeModalRecomendaciones.addEventListener('click', function () {
    modalRecomendaciones.style.display = 'none';
})

/* MODAL CENTRO DE APRENDIZAJE*/
openModalAprendizaje.addEventListener('click', function () {
    modalAprendizaje.style.display = 'flex';
})
closeModalAprendizaje.addEventListener('click', function () {    
    modalAprendizaje.style.display = 'none';
})

/*BARRA DE PROGRESO 5 COLUMNA*/
const spans = document.querySelectorAll('.progress-bar span');
spans.forEach((span) => {
    span.style.width = span.dataset.width;
    span.innerHTML = span.dataset.width;   
});
/*BARRA DE PROGRESO MONITOREO*/
const spanMonitoreo = document.querySelectorAll('.progress-bar-Monitoreo span');
spanMonitoreo.forEach((span) => {
    if (parseInt(span.dataset.width) >= 0 && parseInt(span.dataset.width) <= 50) {
        span.style.width = span.dataset.width;
        span.innerHTML = span.dataset.width;
        span.style.backgroundColor = "rgb(22, 243, 22)"; 
    } else if (parseInt(span.dataset.width) > 50 && parseInt(span.dataset.width) <= 70) {
        span.style.width = span.dataset.width; /*define lo coloreado de acuerdo al porcentaje */
        span.innerHTML = span.dataset.width;
        span.style.backgroundColor = "orange"; 
    } else {
        span.style.width = span.dataset.width;
        span.innerHTML = span.dataset.width;
        span.style.backgroundColor = "red";
    }
});