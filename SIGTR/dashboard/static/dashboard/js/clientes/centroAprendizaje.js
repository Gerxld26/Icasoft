/* CENTRO DE APRENDIZAJE*/
const modalAprendizaje = document.getElementById('modalAprendizaje');
const openModalAprendizaje = document.getElementById('btnCentro');
const closeModalAprendizaje = document.getElementById('closeModalAprendizaje');

async function mostrarVideos() {
    try {
        const responseLearning = await fetch('/dashboard/client/learning-center/'); 
        const dataLearning = await responseLearning.json();  
        const datosVideos = dataLearning.videos;
        var textVideos = '';

        datosVideos.forEach((videoDetalle)=>{
            let tituloVideo = videoDetalle.title;
            const palabras = tituloVideo.split(' ');
            if (palabras.length > 5) {
                tituloVideo = palabras.slice(0, 5).join(' ') + '...';
            }
            
            textVideos += `<div class="contentConsejos" id="contentConsejos-`+ videoDetalle.id +`">`
                    textVideos += `<div class="contentCentro">`
                textVideos += `<div class="textConsejo">`+ tituloVideo + `</div>`
                        textVideos += `<div class="ratio">` 
                            textVideos += `<iframe  class="videoYt"`
                                textVideos += `src="`+ videoDetalle.embed_url + `" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>`
                            textVideos += `</iframe>`
                        textVideos += `</div>`
                    textVideos += `</div>`
            textVideos += `</div>`
        })

        $("#contentConsej").html(textVideos);
        console.log('Datos centro:', dataLearning.videos);
    } catch (error) {
        console.error('Hubo un problema al obtener los videos:', error);
    }
}
function detenerVideos() {
    const iframes = modalAprendizaje.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
        const src = iframe.src;
        iframe.src = '';        // Quita el src
        iframe.src = src;       // Lo vuelve a poner para reiniciar
    });
}
mostrarVideos();
/* MODAL CENTRO DE APRENDIZAJE */
openModalAprendizaje.addEventListener('click', function () {
    modalAprendizaje.style.display = 'flex';
});

closeModalAprendizaje.addEventListener('click', function () {    
    modalAprendizaje.style.display = 'none';
    detenerVideos();
})
window.addEventListener('click', function (event) {
    if(event.target == modalAprendizaje){
        modalAprendizaje.style.display = 'none';
        detenerVideos();
    }
})
