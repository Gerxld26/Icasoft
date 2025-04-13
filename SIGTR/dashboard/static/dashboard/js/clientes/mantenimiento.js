/* MANTENIMIENTO */
const modalMantenimiento = document.getElementById('modalMantenimiento');
const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
const closeModalMantenimiento = document.getElementById('closeModalMant');
const progressBarMantenimiento = document.getElementById('progressBarMantenimiento');

const imgMant = document.getElementById('imgMant');
const imgMantGIF = document.getElementById('imgMantGIF');
const btnMantFunction = document.getElementById('btnMantFunction');
const btnAnalisiMant = document.getElementById('btnAnalisiCompleto');

function configurarMantenimiento(){
    openModalMantenimiento.style.cursor = 'pointer';
    openModalMantenimiento.addEventListener('click', function () {
        modalMantenimiento.style.display = 'flex';
    })

    imgMant.style.display = 'none';
    imgMantGIF.style.display = 'flex';
    openModalMantenimiento.style.fontSize = '18px';
    progressBarMantenimiento.style.display = 'flex';
}
btnMantFunction.addEventListener('click', configurarMantenimiento);
btnAnalisiMant.addEventListener('click', configurarMantenimiento);

closeModalMantenimiento.addEventListener('click', function () {
    modalMantenimiento.style.display = 'none';
})

window.addEventListener('click', function (event) {
    if (event.target == modalMantenimiento) {
        modalMantenimiento.style.display = 'none';
    }
})
