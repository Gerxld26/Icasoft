const progressBarHistorial = document.getElementById('progressBarHistorial');
const imgHist = document.getElementById('imgHistDet');
const btnHistFunction = document.getElementById('btnHistFunction');
const modalHistorial = document.getElementById('btnHist');

btnHistFunction.addEventListener('click', function () {
    imgHist.style.height = '70px';
    modalHistorial.style.fontSize = '18px';
    progressBarHistorial.style.display = 'flex';
});