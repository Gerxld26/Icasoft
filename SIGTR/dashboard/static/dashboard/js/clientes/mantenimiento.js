/* MANTENIMIENTO */
const modalMantenimiento = document.getElementById('modalMantenimiento');
const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
const closeModalMantenimiento = document.getElementById('closeModalMant');
const progressBarMantenimiento = document.getElementById('progressBarMantenimiento');

const imgMant = document.getElementById('imgMant');
const imgMantGIF = document.getElementById('imgMantGIF');
const btnMantFunction = document.getElementById('btnMantFunction');

function notificacionMantenimiento() {
    let progressBar100Mant = true;
    const spanMant = progressBarMantenimiento.querySelector('span');
    const width = spanMant.dataset.width.replace('%', '');
    spanMant.style.width = spanMant.dataset.width;
    spanMant.innerHTML = spanMant.dataset.width;

    if (parseInt(width) < 100) {
        progressBar100Mant = false;
    }
    if (progressBar100Mant) {
        mostrarNotificacion('success', 'Análisis completo del mantenimiento',4);
    }
}

btnMantFunction.addEventListener('click', function(){
    openModalMantenimiento.style.cursor = 'pointer';
    openModalMantenimiento.addEventListener('click', function () {
        modalMantenimiento.style.display = 'flex';
    })

    imgMant.style.display = 'none';
    imgMantGIF.style.display = 'flex';
    openModalMantenimiento.style.fontSize = '18px';
    progressBarMantenimiento.style.display = 'flex';
    notificacionMantenimiento();
});

closeModalMantenimiento.addEventListener('click', function () {
    modalMantenimiento.style.display = 'none';
})

window.addEventListener('click', function (event) {
    if (event.target == modalMantenimiento) {
        modalMantenimiento.style.display = 'none';
    }
})
