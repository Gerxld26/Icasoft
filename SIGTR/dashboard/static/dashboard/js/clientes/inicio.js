let audio = document.getElementById('audioRobot');
let video = document.getElementById('robotGIF');
let videOjos = document.getElementById('robotGIFOjos');
audio.muted = true;  // para evitar bloqueo
//NOTIFICACIONES:
const notificacionesContainer = document.querySelector('.notificaciones');
const advertencia = document.createElement('div');
const success = document.createElement('div');
const danger = document.createElement('div');

const notification = [
    success, advertencia, danger
];
notification.forEach(element => {
    element.classList.add("notification");
});
success.classList.add("success");
advertencia.classList.add("advertencia");
danger.classList.add("danger");
let contador = 0;

function mostrarNotificacion(tipo = 'success', mensaje = 'Mensaje por defecto', index) {
    
    let elemento; // almacenar temporalmente el div correspondiente a la notificación 
    if (tipo === 'success') {
        success.innerHTML = `
        <div id="success-${index}">
            <span><i class="fa-solid fa-circle-check iconNotification"></i></span>
            <div>
                <h3>ÉXITO</h3>
                <p>${mensaje}</p>
            </div>
            <span class="closeSucess" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = success;
    } else if (tipo === 'advertencia') {
        advertencia.innerHTML = `
        <div id="advertencia-${index}">
            <span><i class="fa-solid fa-triangle-exclamation iconNotification"></i></span>
            <div>
                <h3>ADVERTENCIA</h3>
                <p>${mensaje}</p>
            </div>
            <span class="closeAdvert" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = advertencia;
    } else if (tipo === 'danger') {
        danger.innerHTML = `
        <div id="danger-${index}">
            <span><i class="fa-solid fa-circle-xmark iconNotification"></i></span>
            <div>
                <h3>ALERTA</h3>
                <p>${mensaje}</p>
            </div>
            <span class="closeDanger" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = danger;
    }

    notificacionesContainer.appendChild(elemento);
    notificacionesContainer.style.display = 'flex';
    setTimeout(() => {
        notificacionesContainer.style.display = 'none';
    }, 3000);
    $("#closeNotification").on("click", function () {
        notificacionesContainer.style.display = 'none';
    });
}

$(document).ready(function () {
    //tercera columna
    const robotImg = document.getElementById("robotimg");
    const videoRobot = document.getElementById("video-container");
    const videoRobotInput = document.getElementById("video-container2");
    const input = document.querySelector('.textIA');
    const btnAnalisis = document.getElementById('btnAnalisiCompleto');

    $("#robotimg").on('click', function () {
        audio.muted = false;
        audio.play();
        video.play();
        videoRobot.style.display = "flex";
        robotImg.style.display = "none";
    });
    video.addEventListener('ended', function () {
        videoRobot.style.display = "none";
        robotImg.style.display = "flex";
    });
    input.addEventListener('input', function () {
        if (input.value.trim() !== '') {
            videOjos.play();
            videoRobotInput.style.display = "flex";
            robotImg.style.display = "none";
        } else {
            videOjos.pause();
            videOjos.currentTime = 0;
            videoRobotInput.style.display = "none";
            robotImg.style.display = "flex";
        }
    })

    $("#closeNotification").on("click", function () {
        notificacionesContainer.style.display = 'none';
    });

    btnAnalisis.addEventListener('click', function () {
        const allImgs = document.querySelectorAll('.imgDetDiag');
        const allTextsTitulo = document.getElementById('textMonitoreo');
        const allTexts = document.querySelectorAll('.btnUlt'); //cambia el tamaño de letra de la barra de progreso
        const allProgress = document.querySelectorAll('.progress-bar');
        const allSpans = document.querySelectorAll('.progress-bar span'); //Selecciona todos los elementos <span> que están dentro de un .progress-bar.

        let progressBar100 = true;

        allSpans.forEach((span) => {
            const width = span.dataset.width || '0%';
            span.style.width = width;
            span.innerHTML = width;

            const numericWidth = parseInt(width.replace('%', ''));
            if (numericWidth < 100) {
                progressBar100 = false;
            }
        });

        allImgs.forEach((img) => {
            img.style.height = '70px';
        });
        
        allTextsTitulo.style.fontSize = '17px';
        allTextsTitulo.style.padding ='0';

        allTexts.forEach((btn) => {
            btn.style.fontSize = '18px';
        });

        allProgress.forEach((progress) => {
            progress.style.display = 'flex';
        });

        if (progressBar100) {
            mostrarNotificacion('success', 'Análisis completo del sistema',0);
        }

    })
});
