/*DIAGNÓSTICO*/
const modalDiagnostico = document.getElementById('modalDiagnostico');
const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagnostico = document.getElementById('closeModalDiagn');
const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
const imgDiag = document.getElementById('imgDiagnosticoDet');
const imgDiagGIF = document.getElementById('imgDiagGIF');
const btnDiagnostico = document.getElementById('btnDiagnosticoDet');

btnDiagnostico.addEventListener('click', function () {
    openModalDiagnostico.style.cursor ='pointer';
    openModalDiagnostico.addEventListener('click', function () {
        modalDiagnostico.style.display = 'flex';
    })
    imgDiag.style.display = '70px';
    openModalDiagnostico.style.fontSize = '18px';
    progressBarDiagnostico.style.display = 'flex';
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