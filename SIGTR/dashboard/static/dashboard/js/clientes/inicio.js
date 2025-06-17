window.btnPressAnalisis = false;
let audio = document.getElementById('audioRobot');
let video = document.getElementById('robotGIF');
let videOjos = document.getElementById('robotGIFOjos');
audio.muted = true;

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

function mostrarNotificacion(tipo = 'success', mensaje = 'Mensaje por defecto') {
    const mensajeFormateado = mensaje.replace(/<br>/g, '\n');

    const successN = document.getElementById('success');
    const advertenciaN = document.getElementById('advertencia');
    const dangerN = document.getElementById('danger');
    const notificacionesContainer = document.getElementById('notificaciones');

    // Ocultar todos primero
    successN.style.display = 'none';
    advertenciaN.style.display = 'none';
    dangerN.style.display = 'none';

    // Seleccionar el contenedor correcto
    let targetDiv;
    if (tipo === 'success') {
        targetDiv = successN;
    } else if (tipo === 'advertencia') {
        targetDiv = advertenciaN;
    } else if (tipo === 'danger') {
        targetDiv = dangerN;
    }

    // Asignar mensaje
    if (targetDiv) {
        const content = targetDiv.querySelector('.contentNoti');
        content.innerText = mensajeFormateado;
        targetDiv.style.display = 'flex';
        targetDiv.style.animation = 'fadeOut 400ms ease-out 3s';
    }

    notificacionesContainer.style.display = 'flex';

    // Cerrar notificación al hacer clic
    const closeButtons = targetDiv.querySelectorAll('.closeNotification');
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            notificacionesContainer.style.display = 'none';
            targetDiv.style.display = 'none';
        };
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
async function getArch() {
    try {
        const responseArch = await fetch('/dashboard/client/getArchivos/');
        const dataArch = await responseArch.json();
        const archTemp = document.getElementById('archTemp');
        const archUso = document.getElementById('archUso');
        archTemp.textContent = `Archivos temporales: ${dataArch.total_scanned_size}`;
        archUso.textContent = `Archivos en uso: ${dataArch.files_in_use}`;
    } catch (error) {

    }
}
$(document).ready(function () {
    fetchCpuUse();
    getArch();

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

    audio.addEventListener('ended', function () {
        video.pause();
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
                    mostrarNotificacion('success', 'Análisis completo del sistema');
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

function habilitarBotones(type) {
    switch (type) {
        case 'monitoreo':
            btnAbrirModalDiagnostico.disabled = false;
            openModalMantenimiento.disabled = false;
            openModalAntivirus.disabled = false;
            openModalHistorial.disabled = false;
            btnRed.disabled = false;
            break;
        case 'diagnostico':
            openModalMonitoreo.disabled = false;
            openModalMantenimiento.disabled = false;
            openModalAntivirus.disabled = false;
            openModalHistorial.disabled = false;
            btnRed.disabled = false;
            break;
        case 'mantenimiento':
            openModalMonitoreo.disabled = false;
            btnAbrirModalDiagnostico.disabled = false;
            openModalAntivirus.disabled = false;
            openModalHistorial.disabled = false;
            btnRed.disabled = false;
            break;
        case 'antivirus':
            openModalMonitoreo.disabled = false;
            openModalMantenimiento.disabled = false;
            btnAbrirModalDiagnostico.disabled = false;
            openModalHistorial.disabled = false;
            btnRed.disabled = false;
            break;
        case 'historial':
            openModalMonitoreo.disabled = false;
            openModalMantenimiento.disabled = false;
            openModalAntivirus.disabled = false;
            btnAbrirModalDiagnostico.disabled = false;
            btnRed.disabled = false;
            break;
        case 'red':
            openModalMonitoreo.disabled = false;
            openModalMantenimiento.disabled = false;
            btnAbrirModalDiagnostico.disabled = false;
            openModalAntivirus.disabled = false;
            openModalHistorial.disabled = false;
            break;
        default:

            break;
    }
}
function deshabilitarBotones(type) {
    switch (type) {
        case 'monitoreo':
            btnAbrirModalDiagnostico.disabled = true;
            openModalMantenimiento.disabled = true;
            openModalAntivirus.disabled = true;
            openModalHistorial.disabled = true;
            btnRed.disabled = true;
            break;
        case 'diagnostico':
            openModalMonitoreo.disabled = true;
            openModalMantenimiento.disabled = true;
            openModalAntivirus.disabled = true;
            openModalHistorial.disabled = true;
            btnRed.disabled = true;
            break;
        case 'mantenimiento':
            openModalMonitoreo.disabled = true;
            btnAbrirModalDiagnostico.disabled = true;
            openModalAntivirus.disabled = true;
            openModalHistorial.disabled = true;
            btnRed.disabled = true;
            break;
        case 'antivirus':
            openModalMonitoreo.disabled = true;
            openModalMantenimiento.disabled = true;
            btnAbrirModalDiagnostico.disabled = true;
            openModalHistorial.disabled = true;
            btnRed.disabled = true;
            break;
        case 'historial':
            openModalMonitoreo.disabled = true;
            openModalMantenimiento.disabled = true;
            openModalAntivirus.disabled = true;
            btnAbrirModalDiagnostico.disabled = true;
            btnRed.disabled = true;
            break;
        case 'red':
            openModalMonitoreo.disabled = true;
            openModalMantenimiento.disabled = true;
            btnAbrirModalDiagnostico.disabled = true;
            openModalAntivirus.disabled = true;
            openModalHistorial.disabled = true;
            break;
        default:
            btnAbrirModalDiagnostico.disabled = true;
            openModalMantenimiento.disabled = true;
            openModalAntivirus.disabled = true;
            openModalHistorial.disabled = true;
            btnRed.disabled = true;
            break;
    }
}