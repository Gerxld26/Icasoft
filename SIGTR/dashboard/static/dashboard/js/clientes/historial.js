const progressBarHistorial = document.getElementById('progressBarHistorial');
const imgHist = document.getElementById('imgHistDet');
const btnHistFunction = document.getElementById('btnHistFunction');
const modalHistorial = document.getElementById('btnHist');
const btnAnalisisHist = document.getElementById('btnAnalisiCompleto');

function configurarHistorial(){
    modalHistorial.style.cursor = 'pointer';
    imgHist.style.height = '70px';
    modalHistorial.style.fontSize = '18px';
    progressBarHistorial.style.display = 'flex';
}
btnHistFunction.addEventListener('click', configurarHistorial);
btnAnalisisHist.addEventListener('click', configurarHistorial);