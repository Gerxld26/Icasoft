window.btnPressAnalisis = false;
let audio = document.getElementById('audioRobot');
let video = document.getElementById('robotGIF');
let videOjos = document.getElementById('robotGIFOjos');
audio.muted = true;

const notificacionesContainer = document.getElementById('notificaciones');
const notificationDevice = document.getElementById('notificacionesDevice');
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
    const mensajeFormateado = mensaje.replace(/<br>/g, '\n');
    let elemento;
    if (tipo === 'success') {
        success.innerHTML = `
        <div id="success-${index}">
            <span><i class="fa-solid fa-circle-check iconNotification"></i></span>
            <div>
                <h3>ÉXITO</h3>
                <p style="white-space: pre-line;">${mensajeFormateado}</p>
            </div>
            <span class="closeSucess" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = success;
        success.style.animation = 'fadeOut 400ms ease-out 3s';
    } else if (tipo === 'advertencia') {
        advertencia.innerHTML = `
        <div id="advertencia-${index}">
            <span><i class="fa-solid fa-triangle-exclamation iconNotification"></i></span>
            <div>
                <h3>ADVERTENCIA</h3>
                <p style="white-space: pre-line;">${mensajeFormateado}</p>
            </div>
            <span class="closeAdvert" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = advertencia;
        advertencia.style.animation = 'fadeOut 400ms ease-out 3s';
    } else if (tipo === 'danger') {
        danger.innerHTML = `
        <div id="danger-${index}">
            <span><i class="fa-solid fa-circle-xmark iconNotification"></i></span>
            <div>
                <h3>ALERTA</h3>
                <p style="white-space: pre-line;">${mensajeFormateado}</p>
            </div>
            <span class="closeDanger" id="closeNotification"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
        elemento = danger;
        danger.style.animation = 'fadeOut 400ms ease-out 3s';
    }

    notificacionesContainer.appendChild(elemento);
    notificacionesContainer.style.display = 'flex';
    setTimeout(() => {
        notificacionesContainer.style.display = 'none';
    }, 2000);
    $("#closeNotification").on("click", function () {
        notificacionesContainer.style.display = 'none';
    });
}
function notificacionDetalle(mensaje = 'Mensaje por defecto') {
    const mensajeFormateado = mensaje.replace(/<br>/g, '\n');
    let elemento;

    danger.innerHTML = `
        <div id="dangerDev">
            <span><i class="fa-solid fa-circle-xmark iconNotification"></i></span>
            <div>
                <h3>ALERTA</h3>
                <p style="white-space: pre-line;">${mensajeFormateado}</p>
            </div>
            <span class="closeDanger"  id="closeNotificationDev"><i class="fa-solid fa-xmark iconNotifClose"></i></span>
        </div>`;
    elemento = danger;

    notificationDevice.appendChild(elemento);
    notificationDevice.style.display = 'flex';
    $("#closeNotificationDev").on("click", function () {
        notificationDevice.style.display = 'none';
    });
}
function animarProgreso(span, porcentajeFinal, callback, typeNotification) {
    let actual = 0;
    const intervalo = setInterval(() => {
        if (actual >= porcentajeFinal) {
            clearInterval(intervalo);
            if (typeof typeNotification === 'function') {
                setTimeout(() => {
                    typeNotification();
                }, 1500);
            }
            if (typeof callback === 'function') {
                callback();
            }
        } else {
            actual++;
            span.style.width = actual + '%';
            span.textContent = actual + '%';
        }
    }, 30);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function fetchCpuUse() {
    try {

        const responseCPUPr = await fetch('/dashboard/client/monitoring/cpu/data/');
        const dataCPUPor = await responseCPUPr.json();
        //Barra de progreso CPU dinámico:
        const useCPU = document.getElementById('useCPU');
        useCPU.textContent = `CPU en uso: ${dataCPUPor.usage} %`

    } catch (error) {

    }
}

$(document).ready(function () {
    fetchCpuUse();
    // getCache();
    const btnLiberarEspacio = document.getElementById('liberarEspacio');
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', clearTempSpace);
    }

    const btnMostrarGrandes = document.getElementById('mostrarGrandes');
    if (btnMostrarGrandes) {
        btnMostrarGrandes.addEventListener('click', mostrarArchivosMasGrandes);
    }

    const robotImg = document.getElementById("robotimg");
    const videoRobot = document.getElementById("video-container");
    const videoRobotInput = document.getElementById("video-container2");
    const mensajeIA = document.getElementById('mensajeIA');
    const input = document.getElementById('textIAID');
    const btnAnalisis = document.getElementById('btnAnalisiCompleto');

    $("#robotimg").on('click', function () {
        audio.muted = false;
        audio.play();
        video.play();
        videoRobot.style.display = "flex";
        robotImg.style.display = "none";
        input.style.pointerEvents = 'none';
        mensajeIA.style.opacity = '0.4';
    });

    video.addEventListener('ended', function () {
        videoRobot.style.display = "none";
        robotImg.style.display = "flex";
        input.style.pointerEvents = 'auto';
        mensajeIA.style.opacity = '1';
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
    function animarProgreso2(span, porcentajeFinal, onComplete) {
        let actual = 0;
        const intervalo = setInterval(() => {
            if (actual >= porcentajeFinal) {
                clearInterval(intervalo);
                onComplete();
            } else {
                actual++;
                span.style.width = actual + '%';
                span.textContent = actual + '%';
            }
        }, 20);
    }
    btnAnalisis.addEventListener('click', function () {
        window.btnPressAnalisis = true;
        const allImgs = document.querySelectorAll('.imgDetDiag');
        const allTextsTitulo = document.getElementById('textMonitoreo');
        const imgGraficoMon = document.getElementById('imgGraficoMonitoreo');
        const allTexts = document.querySelectorAll('.btnUlt');
        const allProgress = document.querySelectorAll('.progress-bar');
        const allSpans = document.querySelectorAll('.progress-bar span');

        let completados = 0;
        const totalSpans = allSpans.length;

        allSpans.forEach((span) => {
            const final = parseInt(span.dataset.width.replace('%', '')) || 0;

            animarProgreso2(span, final, () => {
                completados++;
                if (completados === totalSpans) {
                    mostrarNotificacion('success', 'Análisis completo del sistema', 0);
                }
            });
        });

        allImgs.forEach((img) => {
            img.style.height = '70px';
        });

        allTextsTitulo.style.fontSize = '17px';
        allTextsTitulo.style.padding = '0';
        imgGraficoMon.style.animation = "rotarImg 1.5s linear infinite";
        imgMant.style.display = 'none';
        imgMantGIF.style.display = 'flex';
        openModalMonitoreo.style.cursor = 'pointer';

        allTexts.forEach((btn) => {
            btn.style.fontSize = '18px';
        });

        allProgress.forEach((progress) => {
            progress.style.display = 'flex';
        });
    });

});

