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
btnOptimizarAntivirus.addEventListener('click', function () {
    openModalAntivirus.addEventListener('click', function () {
        modalAntivirus.style.display = 'flex';
    })
    imgDetDiag.style.height = '70px';
    openModalAntivirus.style.fontSize = '18px';
    progressBarAnt.style.display = 'flex';
});