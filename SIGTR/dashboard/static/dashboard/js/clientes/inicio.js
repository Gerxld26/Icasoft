let btnPressAnalisis = false;
let audio = document.getElementById('audioRobot');
let video = document.getElementById('robotGIF');
let videOjos = document.getElementById('robotGIFOjos');
audio.muted = true;

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
                callback();
            }
        } else {
            actual++;
            span.style.width = actual + '%';
            span.textContent = actual + '%';
        }
    }, 30);
}

async function fetchTemp() {
    try {
        const responseTemp = await fetch('/dashboard/client/get-temp-size/');

        if (!responseTemp.ok) {
            throw new Error(`HTTP error! status: ${responseTemp.status}`);
        }

        const dataTemp = await responseTemp.json();
        const archTemp = document.getElementById('archTemp');

        if (dataTemp.status === 'success') {
            archTemp.innerHTML = `
                <div class="temp-info">
                    <div class="temp-size">Archivos Temporales: ${dataTemp.total_temp_size || '0 MB'}</div>
                    <div class="temp-files-count">
                        
                        <small style="display:block; font-size:0.7em; color:#888;">
                            ${dataTemp.files_in_use_count} archivos en uso 
                        </small>
                    </div>
                </div>
            `;

            const tempIndicator = document.querySelector('.temp-indicator');
            if (tempIndicator) {
                const sizeInMB = parseFloat(dataTemp.total_temp_size);
                let indicatorClass = 'low';

                if (sizeInMB >= 500) {
                    indicatorClass = 'high';
                } else if (sizeInMB >= 100) {
                    indicatorClass = 'medium';
                }

                tempIndicator.className = `temp-indicator ${indicatorClass}`;
            }
        } else {
            archTemp.innerHTML = `
                <div class="temp-error">
                    Error al obtener información de archivos temporales
                    <small style="display:block; font-size:0.7em; color:#d55;">
                        ${dataTemp.message || 'Error desconocido'}
                    </small>
                </div>
            `;
        }
    } catch (error) {
        const archTemp = document.getElementById('archTemp');
        archTemp.innerHTML = `
            <div class="temp-error">
                Error al conectar con el servidor
                <small style="display:block; font-size:0.7em; color:#d55;">
                    Intente nuevamente más tarde
                </small>
            </div>
        `;
        console.error('Error detallado:', error);
    }
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

async function clearTempSpace() {
    try {
        const cleaningStatus = document.getElementById('cleaningStatus') || createCleaningStatus();
        cleaningStatus.style.display = 'block';
        cleaningStatus.innerHTML = `
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: 0%;">
                    <span>0%</span>
                </div>
            </div>
            <div class="status-text">Iniciando limpieza...</div>
        `;

        const progressBar = cleaningStatus.querySelector('.progress-bar');
        const statusText = cleaningStatus.querySelector('.status-text');

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) {
                clearInterval(progressInterval);
                return;
            }
            progressBar.style.width = `${progress}%`;
            progressBar.querySelector('span').textContent = `${progress}%`;

            if (progress < 30) {
                statusText.textContent = "Escaneando archivos temporales...";
            } else if (progress < 60) {
                statusText.textContent = "Verificando archivos a eliminar...";
            } else {
                statusText.textContent = "Limpiando archivos temporales...";
            }
        }, 200);

        const response = await fetch('/dashboard/client/clear-space/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        clearInterval(progressInterval);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        progressBar.style.width = '100%';
        progressBar.querySelector('span').textContent = '100%';

        if (data.status === 'success') {
            statusText.textContent = "¡Limpieza completada con éxito!";

            mostrarNotificacion('success', data.message);

            const resultadoLimpieza = document.getElementById('resultadoLimpieza') || createResultElement();
            resultadoLimpieza.style.display = 'block';
            resultadoLimpieza.innerHTML = `
                <div class="cleaning-result success">
                    <div class="result-icon">✓</div>
                    <div class="result-details">
                        <h4>ESPACIO LIBERADO EXITOSAMENTE</h4>
                        <p>Archivos eliminados: ${data.total_deleted}.</p>
                        <p>Tamaño liberado: ${data.space_freed}.</p>
                        <p>Archivos en uso no eliminados: ${data.files_in_use}.</p>
                    </div>
                    <button class="close-result">×</button>
                </div>
            `;

            const closeButton = resultadoLimpieza.querySelector('.close-result');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    resultadoLimpieza.style.display = 'none';
                });
            }

            fetchTemp();
        } else {
            statusText.textContent = "Error durante la limpieza";
            mostrarNotificacion('danger', data.message);
        }
    } catch (error) {
        console.error('Error al limpiar espacio:', error);
        mostrarNotificacion('danger', 'Error al limpiar archivos temporales');

        const cleaningStatus = document.getElementById('cleaningStatus');
        if (cleaningStatus) {
            const progressBar = cleaningStatus.querySelector('.progress-bar');
            const statusText = cleaningStatus.querySelector('.status-text');

            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = '#dc3545';
            progressBar.querySelector('span').textContent = 'Error';
            statusText.textContent = "Error al limpiar archivos temporales";
        }
    }
}

function createCleaningStatus() {
    const element = document.createElement('div');
    element.id = 'cleaningStatus';
    element.className = 'cleaning-status';

    const container = document.querySelector('.modal-body') || document.body;
    container.appendChild(element);

    return element;
}

function createResultElement() {
    const element = document.createElement('div');
    element.id = 'resultadoLimpieza';
    element.className = 'cleaning-result-container';

    const container = document.querySelector('.modal-body') || document.body;
    container.appendChild(element);

    return element;
}

async function mostrarArchivosMasGrandes() {
    try {
        const response = await fetch('/dashboard/client/get-largest-temp-files/');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.large_files && data.large_files.length > 0) {
            const largeFilesContainer = document.getElementById('largeFilesContainer') || createLargeFilesContainer();

            let tableHtml = `
                <h4>Archivos temporales más grandes</h4>
                <table class="large-files-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Tamaño</th>
                            <th>Ubicación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.large_files.forEach(file => {
                const fileName = file.path.split('/').pop();
                const location = file.path.replace(fileName, '');

                tableHtml += `
                    <tr data-path="${file.path}">
                        <td>${fileName}</td>
                        <td>${file.size}</td>
                        <td title="${location}">${truncateText(location, 30)}</td>
                        <td>
                            <button class="delete-file-btn" data-path="${file.path}">Eliminar</button>
                        </td>
                    </tr>
                `;
            });

            tableHtml += `
                    </tbody>
                </table>
            `;

            largeFilesContainer.innerHTML = tableHtml;
            largeFilesContainer.style.display = 'block';

            const deleteButtons = largeFilesContainer.querySelectorAll('.delete-file-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', async (event) => {
                    const filePath = event.target.dataset.path;
                    await eliminarArchivoEspecifico(filePath);

                    mostrarArchivosMasGrandes();
                    fetchTemp();
                });
            });
        }
    } catch (error) {
        console.error('Error al obtener archivos grandes:', error);
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function createLargeFilesContainer() {
    const element = document.createElement('div');
    element.id = 'largeFilesContainer';
    element.className = 'large-files-container';

    const container = document.querySelector('.modal-body') || document.body;
    container.appendChild(element);

    return element;
}

async function eliminarArchivoEspecifico(filePath) {
    try {
        const response = await fetch('/dashboard/client/clear-specific-temp/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_paths: [filePath]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success') {
            mostrarNotificacion('success', `Archivo eliminado: ${data.deleted} (${data.space_freed})`);
        } else {
            mostrarNotificacion('danger', data.message);
        }

        return data;
    } catch (error) {
        console.error('Error al eliminar archivo específico:', error);
        mostrarNotificacion('danger', 'Error al eliminar archivo');
        throw error;
    }
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
    fetchTemp();
    fetchCpuUse();
    const btnLiberarEspacio = document.getElementById('liberarEspacio');
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', clearTempSpace);
    }

    const btnMostrarGrandes = document.getElementById('mostrarGrandes');
    if (btnMostrarGrandes) {
        btnMostrarGrandes.addEventListener('click', mostrarArchivosMasGrandes);
    }

    initMapAsistencia();
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
        btnPressAnalisis = true;
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
    // Activar al presionar Enter con texto
    $("#textIAID").on('keydown', function (e) {
        const asistenteSoporte = document.getElementById('asistenteSoporte');

        if (e.key === 'Enter') { //presionar enter
            e.preventDefault();
            const mensaje = $(this).val().trim();

            if (mensaje !== "") { //si es diferente de vacío
                asistenteSoporte.classList.add('modo-chat-activo');
            }
        }
    });

    // Desactivar si el input se borra
    $("#textIAID").on('input', function () {
        const asistenteSoporte = document.getElementById('asistenteSoporte');
        const mensaje = $(this).val().trim();

        if (mensaje === "") {
            asistenteSoporte.classList.remove('modo-chat-activo');
        }
    });
});

