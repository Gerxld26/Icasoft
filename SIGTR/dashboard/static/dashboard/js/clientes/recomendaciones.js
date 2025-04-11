/* RECOMENDACIONES */
const modalRecomendaciones = document.getElementById('modalRecomendaciones');
const openModalRecomendaciones = document.getElementById('btnVerCompleto');
const closeModalRecomendaciones = document.getElementById('closeModalRecom');

/*MODALRECOMENDACIONES*/
openModalRecomendaciones.addEventListener('click', function () {
    modalRecomendaciones.style.display = 'flex';
})
closeModalRecomendaciones.addEventListener('click', function () {
    modalRecomendaciones.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if (event.target == modalRecomendaciones) {
        modalRecomendaciones.style.display = 'none';
    }
})