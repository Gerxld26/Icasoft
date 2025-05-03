const actionUrls = window.ACTION_URLS = {
    cleanup: "/dashboard/client/clear-space/",
    update: "/dashboard/client/maintenance/update-software/",
    defrag: "/dashboard/client/maintenance/defragment-disk/",
    repair: "/dashboard/client/maintenance/repair-disk/"
 };
 
 const modalMantenimiento = document.getElementById('modalMantenimiento');
 const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
 const closeModalMantenimiento = document.getElementById('closeModalMant');
 const progressBarMantenimiento = document.getElementById('progressBarMantenimiento');
 const spanMant = progressBarMantenimiento.querySelector('span');
 const imgMant = document.getElementById('imgMant');
 const imgMantGIF = document.getElementById('imgMantGIF');
 
 const btnLiberarEspacio = document.querySelector('#cardData1 .btnCardDataFunction');
 const btnActualizarSoftware = document.querySelector('#cardData2 .btnCardDataFunction');
 const btnDesfragmentar = document.querySelector('#cardData3 .btnCardDataFunction');
 const btnReparar = document.querySelector('#cardData4 .btnCardDataFunction');
 let resultadoMantenimiento = document.getElementById('mantenimientoResultado');
 let contadorIntervalo = null;
 
 function MantenimientoFunction() {
    openModalMantenimiento.style.pointerEvents = 'none';
    spanMant.style.width = '0%';
    spanMant.textContent = '0%';
    const porcentajeFinal = parseInt(spanMant.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del mantenimiento', 5);
 
    animarProgreso(spanMant, porcentajeFinal, () => {
        setTimeout(() => {
            modalMantenimiento.style.display = 'flex';
            modalMantenimiento.style.fontSize = '18px';
            openModalMantenimiento.style.pointerEvents = 'auto';
        }, 3000);
    }, typeNotification);
 }
 
 openModalMantenimiento.style.cursor = 'pointer';
 openModalMantenimiento.addEventListener('click', function () {
    const contenedorMant = document.querySelector(".ultMant");
    contenedorMant.classList.add("borde-animado");
    if (btnPressAnalisis) { 
        modalMantenimiento.style.display = 'flex';
    } else {
        MantenimientoFunction();
    }
    openModalMantenimiento.style.fontSize = '18px';
    imgMant.style.display = 'none';
    imgMantGIF.style.display = 'flex';
    progressBarMantenimiento.style.display = 'flex';
 })
 
 closeModalMantenimiento.addEventListener('click', function () {
    limpiarContador();
    modalMantenimiento.style.display = 'none';
 })
 
 window.addEventListener('click', function (event) {
    if (event.target == modalMantenimiento) {
        limpiarContador();
        modalMantenimiento.style.display = 'none';
    }
 });
 
 function mostrarResultado(mensaje, tipo = 'info') {
    if (!resultadoMantenimiento) {
        resultadoMantenimiento = document.createElement('div');
        resultadoMantenimiento.id = 'mantenimientoResultado';
        resultadoMantenimiento.className = `resultado-${tipo}`;
 
        let icono = 'fas fa-info-circle';
        if (tipo === 'success') {
            icono = 'fas fa-check-circle';
        } else if (tipo === 'error') {
            icono = 'fas fa-exclamation-circle';
        } else if (tipo === 'warning') {
            icono = 'fas fa-exclamation-triangle';
        }
        resultadoMantenimiento.innerHTML = `
             <div id="iconResult"><i class="${icono}"></i></div>
            <div id="resultadoMensaje">${mensaje}</div>
        `;
 
        const contentData = document.querySelector('#modalMantenimiento .contentData');
        contentData.appendChild(resultadoMantenimiento);
 
    } else {
        resultadoMantenimiento.className = `resultado-${tipo}`;
        let icono = 'fas fa-info-circle';
        if (tipo === 'success') {
            icono = 'fas fa-check-circle';
        } else if (tipo === 'error') {
            icono = 'fas fa-exclamation-circle';
        } else if (tipo === 'warning') {
            icono = 'fas fa-exclamation-triangle';
        } else {
        }
 
        const iconoElement = resultadoMantenimiento.querySelector('i');
        if (iconoElement) {
            iconoElement.className = `${icono}`;
        }
 
        const mensajeElement = resultadoMantenimiento.querySelector('#resultadoMensaje');
        if (mensajeElement) {
            mensajeElement.innerHTML = mensaje;
        }
 
        resultadoMantenimiento.style.display = 'grid';
    }
 }
 
 function limpiarContador() {
    if (contadorIntervalo) {
        clearInterval(contadorIntervalo);
        contadorIntervalo = null;
    }
 }
 
 function mostrarCargando(boton, cargando = true) {
    if (!boton) return;
 
    if (cargando) {
        boton.dataset.originalText = boton.innerHTML;
        boton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
        boton.disabled = true;
        boton.style.opacity = '0.7';
    } else {
        if (boton.dataset.originalText) {
            boton.innerHTML = boton.dataset.originalText;
        }
        boton.disabled = false;
        boton.style.opacity = '1';
    }
 }
 
 function manejarEstadoRespuesta(data) {
    limpiarContador();
 
    switch (data.status) {
        case 'in_progress':
            mostrarResultado(`
                <div class="progress-indicator">
                    <div class="spinner"></div>
                    <p>Operación en curso. Por favor, espera un momento...</p>
                    <p class="countdown">Tiempo transcurrido: <span id="tiempo-transcurrido">0</span> segundos</p>
                </div>
            `, 'warning');
 
            let segundos = 0;
            contadorIntervalo = setInterval(() => {
                segundos++;
                const tiempoElement = document.getElementById('tiempo-transcurrido');
                if (tiempoElement) {
                    tiempoElement.textContent = segundos;
                }
 
                if (segundos >= 30) {
                    clearInterval(contadorIntervalo);
                    contadorIntervalo = null;
                    mostrarResultado(`
                        <p><i class="fas fa-info-circle text-warning"></i> La operación está tomando más tiempo de lo esperado.</p>
                        <p>Puedes continuar usando el sistema mientras se completa en segundo plano.</p>
                        <p>Los resultados se actualizarán automáticamente cuando estén disponibles.</p>
                    `, 'warning');
                }
            }, 1000);
            break;
 
        case 'scheduled':
            mostrarResultado(`
                <div>
                    <p><i class="fas fa-clock text-warning"></i> <strong>Operación programada para el próximo reinicio</strong></p>
                    <p>Esta operación requiere reiniciar el equipo para completarse.</p>
                    <p>Por favor, guarda tu trabajo y reinicia el sistema cuando sea conveniente.</p>
                    <button id="btn-recordatorio" class="btn btn-sm btn-outline-warning mt-2">Recordármelo más tarde</button>
                </div>
            `, 'warning');
 
            setTimeout(() => {
                const btnRecordatorio = document.getElementById('btn-recordatorio');
                if (btnRecordatorio) {
                    btnRecordatorio.addEventListener('click', () => {
                        alert('Se te recordará sobre esta tarea pendiente en 1 hora.');
                        mostrarResultado(`
                            <p><i class="fas fa-bell text-info"></i> <strong>Recordatorio programado</strong></p>
                            <p>Se te recordará sobre la operación pendiente en 1 hora.</p>
                            <p>Puedes cerrar esta ventana y continuar trabajando.</p>
                        `, 'info');
                    });
                }
            }, 100);
            break;
 
        case 'success':
            mostrarResultado(`
                <div>ESPACIO LIBERADO EXITOSAMENTE</div>
                <div id="resultadoMensaje">${data.message}</div>
            `, 'success');
            break;
 
        case 'error':
        default:
            mostrarResultado(`
                <div>
                    <p>${data.message || "Error desconocido"}</p>
                    <p class="text-muted">Si el problema persiste, contacta con soporte técnico.</p>
                </div>
            `, 'error');
            break;
    }
 }
 
 async function ejecutarAccion(accion, boton) {
    limpiarContador();
    mostrarCargando(boton, true);
 
    const url = actionUrls[accion];
    if (!url) {
        console.error(`URL no encontrada para la acción: ${accion}`);
        mostrarResultado(`
            <div>
                <p><i class="fas fa-exclamation-circle text-danger"></i> <strong>ERROR</strong></p>
                <p>Acción no válida o no configurada.</p>
            </div>
        `, 'error');
        mostrarCargando(boton, false);
        return;
    }
 
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
 
        if (!response.ok) {
            throw new Error(`Error del servidor (HTTP ${response.status})`);
        }
 
        const data = await response.json();
        console.log("Datos recibidos:", data);
 
        manejarEstadoRespuesta(data);
 
    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`
            <div>
                <p><strong>ERROR INESPERADO</strong></p>
                <p>${error.message || "No se pudo ejecutar la acción."}</p>
                <p>Por favor, inténtelo de nuevo o contacte con soporte técnico.</p>
            </div>
        `, 'error');
    } finally {
        mostrarCargando(boton, false);
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
 
 async function fetchAndDisplayTempInfo() {
    const archTemp = document.getElementById('archTemp');
    
    if (!archTemp) {
        console.error('Elemento archTemp no encontrado en el DOM');
        return;
    }
    
    archTemp.innerHTML = `
        <div class="loading-temp-info">
            <i class="fas fa-spinner fa-spin" style="margin-right: 8px; color: #00c8ff;"></i>
            <span>Cargando archivos temporales...</span>
        </div>
    `;
 
    try {
        const response = await fetch('/dashboard/client/get-temp-size/', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
 
        if (!response.ok) {
            throw new Error(`Error obteniendo información de archivos temporales: ${response.status}`);
        }
 
        const data = await response.json();
        
        if (data.status === 'success') {
            archTemp.innerHTML = `
                <div class="temp-info">
                    <div class="temp-size">Archivos Temporales: ${data.total_temp_size || '0 MB'}</div>
                    <div class="temp-files-count">
                        <small style="display:block; font-size:0.7em; color:#888;">
                            ${data.files_in_use_count} archivos en uso 
                        </small>
                    </div>
                </div>
            `;
 
            const tempIndicator = document.querySelector('.temp-indicator');
            if (tempIndicator) {
                actualizarIndicadorTemporal(data.total_temp_size, tempIndicator);
            }
        } else {
            archTemp.innerHTML = `
                <div class="temp-error">
                    Error al obtener información de archivos temporales
                    <small style="display:block; font-size:0.7em; color:#d55;">
                        ${data.message || 'Error desconocido'}
                    </small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al actualizar información de archivos temporales:', error);
        
        archTemp.innerHTML = `
            <div class="temp-error">
                Error al conectar con el servidor
                <small style="display:block; font-size:0.7em; color:#d55;">
                    Intente nuevamente más tarde
                </small>
                <button id="retry-temp-fetch" class="retry-button">Reintentar</button>
            </div>
        `;
        
        setTimeout(() => {
            const retryButton = document.getElementById('retry-temp-fetch');
            if (retryButton) {
                retryButton.addEventListener('click', fetchAndDisplayTempInfo);
            }
        }, 100);
    }
 }
 
 document.addEventListener('DOMContentLoaded', function () {
    fetchAndDisplayTempInfo();
    setInterval(fetchAndDisplayTempInfo, 60000);
 
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', function () {
            ejecutarAccion('cleanup', this);
        });
    }
 
    if (btnActualizarSoftware) {
        btnActualizarSoftware.addEventListener('click', function () {
            ejecutarAccion('update', this);
        });
    }
 
    if (btnDesfragmentar) {
        btnDesfragmentar.addEventListener('click', function () {
            ejecutarAccion('defrag', this);
        });
    }
 
    if (btnReparar) {
        btnReparar.addEventListener('click', function () {
            ejecutarAccion('repair', this);
        });
    }
 });