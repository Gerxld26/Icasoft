const progressBarHistorial = document.getElementById('progressBarHistorial');
const imgHist = document.getElementById('imgHistDet');
const btnHistFunction = document.getElementById('btnHistFunction');
const modalHistorial = document.getElementById('btnHist');

function notificacionHistorial() {
    let progressBar100Hist = true;
    const spanHistorial = progressBarHistorial.querySelector('span');
    const width = spanHistorial.dataset.width.replace('%', '');
    spanHistorial.style.width = spanHistorial.dataset.width;
    spanHistorial.innerHTML = spanHistorial.dataset.width;

    if (parseInt(width) < 100) {
        progressBar100Hist = false;
    }
    if (progressBar100Hist) {
        mostrarNotificacion('success', 'El historial ya está listo',5);
    }
}

btnHistFunction.addEventListener('click', function(){
    modalHistorial.style.cursor = 'pointer';
    imgHist.style.height = '70px';
    modalHistorial.style.fontSize = '18px';
    progressBarHistorial.style.display = 'flex';
    notificacionHistorial();
});
