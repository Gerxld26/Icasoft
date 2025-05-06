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

const TempFileMonitor = {
    lastSize: null,
    lastCheck: 0,
    minCheckInterval: 5000, // 5 segundos mínimo entre verificaciones
    warningThreshold: 500, // MB
    isMonitoring: false,
    
    async checkTempFiles() {
        const now = Date.now();
        if (now - this.lastCheck < this.minCheckInterval) return;
        
        try {
            const response = await fetch('/dashboard/client/get-temp-size/');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.status !== 'success') throw new Error(data.message || 'Error desconocido');
            
            const currentSize = parseFloat(data.total_temp_size);
            const archTemp = document.getElementById('archTemp');
            
            // Actualizar solo si hay cambios significativos (más de 1MB de diferencia)
            if (this.lastSize === null || Math.abs(currentSize - this.lastSize) > 1) {
                this.lastSize = currentSize;
                
                archTemp.innerHTML = `
                    <div class="temp-info">
                        <div class="temp-size">
                            <i class="fas ${this.getStatusIcon(currentSize)}"></i>
                            Archivos Temporales: ${data.total_temp_size || '0 MB'}
                        </div>
                        <div class="temp-files-count">
                            <small style="display:block; font-size:0.7em; color:#888;">
                                ${data.files_in_use_count} archivos en uso 
                            </small>
                        </div>
                    </div>
                `;

                // Actualizar indicador visual
                const tempIndicator = document.querySelector('.temp-indicator');
                if (tempIndicator) {
                    tempIndicator.className = `temp-indicator ${this.getStatusClass(currentSize)}`;
                }

                // Mostrar advertencia si es necesario
                if (currentSize >= this.warningThreshold) {
                    mostrarNotificacion('advertencia', 
                        `Los archivos temporales están ocupando ${data.total_temp_size}.\nConsidere liberar espacio.`);
                }
            }
            
        } catch (error) {
            console.error('Error al verificar archivos temporales:', error);
            const archTemp = document.getElementById('archTemp');
            archTemp.innerHTML = `
                <div class="temp-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al conectar con el servidor
                    <button onclick="TempFileMonitor.checkTempFiles()" class="retry-button">
                        Reintentar
                    </button>
                </div>
            `;
        } finally {
            this.lastCheck = now;
        }
    },

    getStatusIcon(size) {
        if (size >= this.warningThreshold) return 'fa-exclamation-triangle text-warning';
        if (size >= 100) return 'fa-info-circle text-info';
        return 'fa-check-circle text-success';
    },

    getStatusClass(size) {
        if (size >= this.warningThreshold) return 'high';
        if (size >= 100) return 'medium';
        return 'low';
    },

    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.checkTempFiles();

        // Eventos que disparan verificación
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkTempFiles();
            }
        });

        // Verificar después de acciones de limpieza
        const cleanupEvents = ['tempCleanup', 'fileDelete', 'maintenance'];
        cleanupEvents.forEach(event => {
            document.addEventListener(event, () => this.checkTempFiles());
        });
    }
};

// Reemplazar la llamada existente a fetchTemp() con:
$(document).ready(function() {
    TempFileMonitor.startMonitoring();
    
    // ... resto del código existente ...
    
    // Actualizar los eventos de limpieza para disparar la verificación
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', async function() {
            await clearTempSpace();
            document.dispatchEvent(new Event('tempCleanup'));
        });
    }
});

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

