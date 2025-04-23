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
                callback(); // Se abre el modal (3s después en callback original)
            }
        } else {
            actual++;
            span.style.width = actual + '%';
            span.textContent = actual + '%';
        }
    }, 20);
}
async function fecthTemp() {
    const responseTemp = await fetch('/dashboard/client/tamano-temp/');
    const dataTemp = await responseTemp.json();
    archTemp = document.getElementById('archTemp');
    archTemp.textContent = `Archivos Temporales: ${dataTemp.tamano_total}`;
}

$(document).ready(function () {
    fecthTemp();
    if (typeof L === 'undefined') {
        console.error("Leaflet no está cargado.");
        return;
    }

    initBasicMap();
    initMapAsistencia();
    //tercera columna
    const robotImg = document.getElementById("robotimg");
    const videoRobot = document.getElementById("video-container");
    const videoRobotInput = document.getElementById("video-container2");
    const mensajeIA = document.getElementById('mensajeIA');
    const input = document.querySelector('.textIA');
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
                onComplete(); // Notificamos que este span terminó
            } else {
                actual++;
                span.style.width = actual + '%';
                span.textContent = actual + '%';
            }
        }, 20); // velocidad
    }
    btnAnalisis.addEventListener('click', function () {
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
                    btnOptimizarAntivirus.click();
                    btnMantFunction.click();
                    btnHistFunction.click();
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
function initBasicMap() {
    const defaultLat = -12.0464;
    const defaultLng = -77.0428;
    const defaultZoom = 15;

    const mapInicio = L.map("map", {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(mapInicio);

    L.control.zoom({
        position: 'topright'
    }).addTo(mapInicio);

    // Icono azul personalizado
    const userIcon = L.icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let marcadorUbi = null;

    // Ver si el navegador soporta geolocalización

    navigator.geolocation.watchPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (!marcadorUbi) {
                // Crear el marcador por primera vez
                marcadorUbi = L.marker([lat, lng], { icon: userIcon }).addTo(mapInicio);
                marcadorUbi.bindPopup("Tu ubicación actual").openPopup();
                mapInicio.setView([lat, lng], defaultZoom);
            } else {
                // Actualizar posición
                marcadorUbi.setLatLng([lat, lng]);
            }
        },
        function (error) {
            console.error("Error obteniendo la ubicación:", error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
        }
    );

}

$("#textIAID").on('keypress', function (e) {
    const textAsistente = document.getElementById('textAsistente');
    const asistenteSoporte = document.getElementById('asistenteSoporte');
    const vozIA = document.getElementById('vozIA');
    if (e.which === 13) { //si empiezas a digitar
        var mensaje = $(this).val().trim();

        if (mensaje !== "") {
            textAsistente.style.display = 'none';
            asistenteSoporte.style.gridTemplateAreas = "imagenIA mensajeIA";
            asistenteSoporte.style.gridTemplateRows = '10px auto';
        }
    }
});