/*DIAGNÓSTICO*/
const modalDiagnostico = document.getElementById('modalDiagnostico');
const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagnostico = document.getElementById('closeModalDiagn');
const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
const imgDiag = document.getElementById('imgDiagnosticoDet');
const imgDiagGIF = document.getElementById('imgDiagGIF');
const btnDiagnostico = document.getElementById('btnDiagnosticoDet');

function notificacionDiagnostico() {
    let progressBar100Diag = true;
    const spanDiagnostico = progressBarDiagnostico.querySelector('span');
    const width = spanDiagnostico.dataset.width.replace('%', '');
    spanDiagnostico.style.width = spanDiagnostico.dataset.width;
    spanDiagnostico.innerHTML = spanDiagnostico.dataset.width;
    
    if (parseInt(width) < 100) {
        progressBar100Diag = false;
    }
    if (progressBar100Diag) {
        mostrarNotificacion('success', 'Análisis completo del diagnóstico',2);
    }
}

btnDiagnostico.addEventListener('click', function(){
    openModalDiagnostico.style.cursor = 'pointer';
    openModalDiagnostico.addEventListener('click', function () {
        modalDiagnostico.style.display = 'flex';
    })
    imgDiag.style.display = '70px';
    openModalDiagnostico.style.fontSize = '18px';
    progressBarDiagnostico.style.display = 'flex';
    notificacionDiagnostico();
});

closeModalDiagnostico.addEventListener('click', function () {
    modalDiagnostico.style.display = 'none';
})
/*click fuera del modal se cierre: */
window.addEventListener('click', function (event) {
    if (event.target == modalDiagnostico) {
        modalDiagnostico.style.display = 'none';

    }
})