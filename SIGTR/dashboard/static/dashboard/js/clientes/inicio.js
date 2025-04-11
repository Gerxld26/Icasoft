/*BARRA DE PROGRESO 5 COLUMNA*/
const spans = document.querySelectorAll('.progress-bar span');
spans.forEach((span) => {
    span.style.width = span.dataset.width;
    span.innerHTML = span.dataset.width;   
});
