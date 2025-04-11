/* CENTRO DE APRENDIZAJE*/
const modalAprendizaje = document.getElementById('modalAprendizaje');
const openModalAprendizaje = document.getElementById('btnCentro');
const closeModalAprendizaje = document.getElementById('closeModalAprendizaje');

/* MODAL CENTRO DE APRENDIZAJE*/
openModalAprendizaje.addEventListener('click', function () {
    modalAprendizaje.style.display = 'flex';
})
closeModalAprendizaje.addEventListener('click', function () {    
    modalAprendizaje.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if(event.target == modalAprendizaje){
        modalAprendizaje.style.display = 'none';
    }
})