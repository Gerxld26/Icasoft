const modalAntivirus = document.getElementById('modalAntivirus');
const openModalAntivirus = document.getElementById('btnAbrirModalAntivirus');
const closeModalAntivirus = document.getElementById('closeModalAnt');
const progressBarAnt = document.getElementById('progressBarAntivirus');
const imgDetDiag =document.getElementById('imgAntivirusDet');
const btnOptimizarAntivirus = document.getElementById('btnOptimizarAntivirus');

closeModalAntivirus.addEventListener('click', function () {
    modalAntivirus.style.display = 'none';
})

window.addEventListener('click', function (event) {
    if (event.target == modalAntivirus) {
        modalAntivirus.style.display = 'none';
    }
})
function notificacionAntivirus() {
    let progressBar100Ant = true;
    const spanAnt = progressBarAnt.querySelector('span');
    const width = spanAnt.dataset.width.replace('%', '');
    spanAnt.style.width = spanAnt.dataset.width;
    spanAnt.innerHTML = spanAnt.dataset.width;
    if (parseInt(width) < 100) {
        progressBar100Ant = false;
    }
    if (progressBar100Ant) {
        mostrarNotificacion('success', 'Análisis completo del antivirus',3);
    }
}

btnOptimizarAntivirus.addEventListener('click',function(){
    openModalAntivirus.style.cursor = 'pointer';
    openModalAntivirus.addEventListener('click', function () {
        modalAntivirus.style.display = 'flex';
    })
    imgDetDiag.style.height = '70px';
    openModalAntivirus.style.fontSize = '18px';
    progressBarAnt.style.display = 'flex';
    notificacionAntivirus();
});
