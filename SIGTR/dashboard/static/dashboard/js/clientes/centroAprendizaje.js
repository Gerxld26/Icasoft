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
            textVideos += `<div class="contentConsejos" id="contentConsejos">`
                textVideos += `<div class="centro" id="video-`+ videoDetalle.id +`">`
                    textVideos += `<div class="contentImg">`
                        textVideos += `<i class="fa-brands fa-youtube ytCentro"></i>` 
                    textVideos += `</div>`
                    textVideos += `<div class="contentCentro">`
                        textVideos += `<div class="textConsejo">`+ videoDetalle.title + `</div>`
                        textVideos += `<div class="ratio ratio-16x9">` 
                            textVideos += `<iframe width="230" height="105" `
                                textVideos += `src="`+ videoDetalle.embed_url + `" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>`
                            textVideos += `</iframe>`
                        textVideos += `</div>`
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

/* MODAL CENTRO DE APRENDIZAJE */
openModalAprendizaje.addEventListener('click', function () {
    modalAprendizaje.style.display = 'flex';
    mostrarVideos();
});

closeModalAprendizaje.addEventListener('click', function () {    
    modalAprendizaje.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if(event.target == modalAprendizaje){
        modalAprendizaje.style.display = 'none';
    }
})