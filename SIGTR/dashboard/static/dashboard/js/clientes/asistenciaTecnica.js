/*ASISTENCIA TÉCNICA*/
const modalAsistencia = document.getElementById('modalAsistencia');
const openModalAsistencia = document.getElementById('btnAsistencia');
const closeModalAsis = document.getElementById('closeModalAsis');

openModalAsistencia.addEventListener('click', function () {
    modalAsistencia.style.display = 'flex';
    mapaAsistencia();
})
closeModalAsis.addEventListener('click', function () {
    modalAsistencia.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if (event.target == modalAsistencia) {
        modalAsistencia.style.display = 'none';
    }
})
async function tecnicosDisp() {
    const responseTech = await fetch('/dashboard/client/monitoring/cpu/data/');
}
$(document).ready(function () {
    
});

