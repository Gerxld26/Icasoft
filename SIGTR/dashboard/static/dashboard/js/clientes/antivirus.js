const modalAntivirus = document.getElementById('modalAntivirus');
const openModalAntivirus = document.getElementById('btnAbrirModalAntivirus');
const closeModalAntivirus = document.getElementById('closeModalAnt');
const progressBarAnt = document.getElementById('progressBarAntivirus');
const imgDetDiag =document.getElementById('imgAntivirusDet');
const btnOptimizarAntivirus = document.getElementById('btnOptimizarAntivirus');
const btnAnalisisAnt = document.getElementById('btnAnalisiCompleto');

closeModalAntivirus.addEventListener('click', function () {
    modalAntivirus.style.display = 'none';
})

window.addEventListener('click', function (event) {
    if (event.target == modalAntivirus) {
        modalAntivirus.style.display = 'none';
    }
})
function configurarAntivirus (){
    openModalAntivirus.style.cursor = 'pointer';
    openModalAntivirus.addEventListener('click', function () {
        modalAntivirus.style.display = 'flex';
    })
    imgDetDiag.style.height = '70px';
    openModalAntivirus.style.fontSize = '18px';
    progressBarAnt.style.display = 'flex';
}
btnOptimizarAntivirus.addEventListener('click',configurarAntivirus);
btnAnalisisAnt.addEventListener('click', configurarAntivirus);