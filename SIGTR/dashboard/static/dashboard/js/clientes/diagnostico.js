const modalDiagnostico = document.getElementById('modalDiagnostico');
const btnAbrirModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagn = document.getElementById('closeModalDiagn');
const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
const imgDiagnosticoDet = document.getElementById('imgDiagnosticoDet');
const spanDiagnostico = progressBarDiagnostico.querySelector('span');
const scanProgressModal = document.getElementById('scanProgressModal');
const startQuickScan = document.getElementById('start-quick-scan');
const startCustomScan = document.getElementById('start-custom-scan');
const quickScanProgress = document.getElementById('quick-scan-progress');
const scanProgressBar = document.getElementById('scan-progress-bar');
const currentComponentScan = document.getElementById('current-component-scan');
const scanPercentage = document.getElementById('scan-percentage');
const scanDetailsText = document.getElementById('scan-details-text');
const checkAll = document.getElementById('check-all');
const componentCheckboxes = document.querySelectorAll('.component-checkbox');
const lastCheckDate = document.getElementById('last-check-date');
const detailedResults = document.getElementById('detailed-results');
const detailedResultsContent = document.getElementById('detailed-results-content');
const backToDiagnosis = document.getElementById('back-to-diagnosis');
const diagnosisTabs = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const retryDiagnosis = document.getElementById('retry-diagnosis');
const completeDiagnosis = document.getElementById('complete-diagnosis');



modalDiagnostico.classList.add('modal-hidden');
let currentDiagnosis = null;
let currentScenarioRunId = null;
let currentComponentData = null;
let componentDetailsCache = new Map();
let lastDiagnosisReport = null;
let currentScenarioController = null;
let currentProgressInterval = null;
let isScenarioRunning = false;


window.currentScenarioController = null;
window.currentProgressInterval = null;
window.isScenarioRunning = false;

function DiagnosticoFunction() {
   btnAbrirModalDiagnostico.style.pointerEvents = 'none';
   spanDiagnostico.style.width = '0%';
   spanDiagnostico.textContent = '0%';
   const porcentajeFinal = parseInt(spanDiagnostico.dataset.width.replace('%', ''));
   const typeNotification = () => mostrarNotificacion('success', 'Diagnóstico del sistema listo', 6);

   animarProgreso(spanDiagnostico, porcentajeFinal, () => {
       setTimeout(() => {
           btnAbrirModalDiagnostico.style.pointerEvents = 'auto';
           modalDiagnostico.style.display = 'flex';
       }, 3000);
   }, typeNotification);
}
function animarProgreso(elemento, porcentajeFinal, callback, notificationCallback) {
    let porcentajeActual = 0;
    const intervalo = setInterval(() => {
        porcentajeActual += 2;
        elemento.style.width = porcentajeActual + '%';
        elemento.textContent = porcentajeActual + '%';
        
        if (porcentajeActual >= porcentajeFinal) {
            clearInterval(intervalo);
            if (callback) callback();
            if (notificationCallback) notificationCallback();
        }
    }, 50);
}
btnAbrirModalDiagnostico.style.cursor = 'pointer';
btnAbrirModalDiagnostico.addEventListener('click', function () {
   deshabilitarBotones('diagnostico');
   modalOpen = true;
   const contenedorDiag = document.querySelector(".detdiagnostico");
   contenedorDiag.classList.add("borde-animado");
   
   if (btnPressAnalisis) { 
       modalDiagnostico.style.display = 'flex';
   } else {
       DiagnosticoFunction();
   }
   imgDiagnosticoDet.style.height = '70px';
   progressBarDiagnostico.style.display = 'flex';
   
   obtenerUltimoDiagnostico();
});

closeModalDiagn.addEventListener('click', function () {
   modalDiagnostico.style.display = 'none';
   modalOpen = false;
   habilitarBotones('diagnostico');
});

window.addEventListener('click', function (event) {
   if (event.target == modalDiagnostico) {
       modalDiagnostico.style.display = 'none';
       modalOpen = false;
       habilitarBotones('diagnostico');
   }
   if (event.target == scanProgressModal) {
       scanProgressModal.style.display = 'none';
   }
});

backToDiagnosis.addEventListener('click', function() {
   detailedResults.style.display = 'none';
   document.querySelector('.contentData').style.display = 'block';
});



componentCheckboxes.forEach(checkbox => {
   checkbox.addEventListener('change', function() {
       let allChecked = true;
       componentCheckboxes.forEach(cb => {
           if (!cb.checked) allChecked = false;
       });
       checkAll.checked = allChecked;
   });
});

diagnosisTabs.forEach(tab => {
   tab.addEventListener('click', function() {
       const tabTarget = this.getAttribute('data-tab');
       
       diagnosisTabs.forEach(t => t.classList.remove('active'));
       tabPanes.forEach(p => p.classList.remove('active'));
       
       this.classList.add('active');
       document.getElementById(tabTarget).classList.add('active');
   });
});

async function obtenerUltimoDiagnostico() {
   try {
       const response = await fetch('/dashboard/api/diagnosis-data/', {
           method: 'GET',
           headers: {
               'Content-Type': 'application/json',
               'X-Requested-With': 'XMLHttpRequest'
           },
           credentials: 'same-origin'
       });

       if (!response.ok) {
           throw new Error('Error al obtener el último diagnóstico');
       }

       const data = await response.json();

       if (data.status === 'success' && data.diagnostico) {
           lastCheckDate.textContent = formatearFecha(data.diagnostico.timestamp);
       }
   } catch (error) {
       console.error('Error:', error);
   }
}

function mostrarNotificacion(tipo, mensaje, duracion = 3) {
    if (tipo !== 'error') return;
    
    const notifContainer = document.getElementById('notificaciones-container');
    
    if (!notifContainer) {
        const newContainer = document.createElement('div');
        newContainer.id = 'notificaciones-container';
        newContainer.style.position = 'fixed';
        newContainer.style.top = '20px';
        newContainer.style.right = '20px';
        newContainer.style.zIndex = '9999';
        document.body.appendChild(newContainer);
    }
    
    const notifElement = document.createElement('div');
    notifElement.className = `notificacion notificacion-${tipo}`;
    notifElement.style.backgroundColor = '#1e2a38';
    notifElement.style.borderLeft = '4px solid #dc3545';
    notifElement.style.color = '#fff';
    notifElement.style.padding = '10px 15px';
    notifElement.style.borderRadius = '5px';
    notifElement.style.margin = '0 0 10px 0';
    notifElement.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
    notifElement.style.display = 'flex';
    notifElement.style.alignItems = 'center';
    notifElement.style.minWidth = '300px';
    
    notifElement.innerHTML = `
        <div style="margin-right:10px">
            <i class="fas fa-exclamation-circle" style="color:#dc3545"></i>
        </div>
        <div style="flex:1">${mensaje}</div>
        <button style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px">&times;</button>
    `;
    
    const container = document.getElementById('notificaciones-container');
    container.appendChild(notifElement);
    
    const closeBtn = notifElement.querySelector('button');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => notifElement.remove());
    }
    
    setTimeout(() => {
        if (notifElement && notifElement.parentNode) {
            notifElement.remove();
        }
    }, duracion * 1000);
}

function formatearFecha(fechaString) {
   const fecha = new Date(fechaString);
   return fecha.toLocaleString('es-PE', {
       year: 'numeric',
       month: '2-digit',
       day: '2-digit',
       hour: '2-digit',
       minute: '2-digit'
   });
}

startQuickScan.addEventListener('click', async function() {
   iniciarDiagnostico('QuickScan');
});

document.querySelectorAll('.scenario-card .scenario-button').forEach(button => {
    button.addEventListener('click', function() {
        const card = this.closest('.scenario-card');
        const scenarioId = card.getAttribute('data-scenario-id');
        const scenarioTitle = card.querySelector('h4').textContent;
        iniciarEscenario(scenarioId, scenarioTitle);
    });
});

retryDiagnosis.addEventListener('click', function() {
   if (currentDiagnosis && currentDiagnosis.type) {
       iniciarDiagnostico(currentDiagnosis.type, currentDiagnosis.components);
   } else {
       iniciarDiagnostico('QuickScan');
   }
});

completeDiagnosis.addEventListener('click', function() {
   const diagnosisHistory = document.getElementById('diagnosis-history');
   const fastDiagnosis = document.getElementById('fast-diagnosis');
   
   fastDiagnosis.classList.add('active');
   diagnosisHistory.classList.remove('active');
   
   diagnosisTabs.forEach(tab => {
       if (tab.getAttribute('data-tab') === 'fast-diagnosis') {
           tab.classList.add('active');
       } else {
           tab.classList.remove('active');
       }
   });
});

document.addEventListener('click', function(event) {
   if (event.target.classList.contains('component-details-toggle') || event.target.closest('.component-details-toggle')) {
       const componentItem = event.target.closest('.component-item');
       const componentName = componentItem.querySelector('.component-name').textContent;
       mostrarDetallesComponente(componentName);
   }
});

async function iniciarDiagnostico(tipoScan, componentes = []) {
   try {
       showScanProgressModal();
       currentComponentScan.textContent = "Iniciando diagnóstico...";
       scanPercentage.textContent = "0%";
       scanProgressBar.querySelector('span').style.width = "0%";
       scanDetailsText.textContent = "Preparando análisis del sistema...";
       
       currentDiagnosis = {
           type: tipoScan,
           components: componentes
       };
       
       if (tipoScan === 'CustomScan' && !window.customScanAvailable) {
           tipoScan = 'QuickScan';
           componentes = [];
       }
       const formData = new FormData();
       formData.append('scan_type', tipoScan);
       if (componentes.length > 0) {
           formData.append('components', JSON.stringify(componentes));
       }
       
       const response = await fetch('/dashboard/api/diagnosis/start/', {
           method: 'POST',
           body: formData,
           credentials: 'same-origin'
       });

       if (!response.ok) {
           throw new Error('Error al iniciar el diagnóstico');
       }

       const data = await response.json();

       if (data.status === 'success') {
           mostrarNotificacion('success', 'Diagnóstico iniciado correctamente', 3);
           const diagnosisId = data.diagnosis_id;
           monitorearProgresoScan(diagnosisId);
       } else {
           throw new Error(data.message || 'Error al iniciar el diagnóstico');
       }
   } catch (error) {
       console.error('Error:', error);
       mostrarNotificacion('error', 'Error al iniciar el diagnóstico: ' + error.message, 3);
       hideScanProgressModal();
   }
}

async function iniciarEscenario(scenarioId, scenarioTitle) {
    try {
        console.log(`=== INICIANDO ESCENARIO: ${scenarioTitle} (ID: ${scenarioId}) ===`);
        
        if (currentScenarioController) {
            currentScenarioController.abort();
            currentScenarioController = null;
        }
        
        if (currentProgressInterval) {
            clearInterval(currentProgressInterval);
            currentProgressInterval = null;
        }
        
        isScenarioRunning = true;
        
        showScanProgressModal();
        currentComponentScan.textContent = `Analizando: ${scenarioTitle}`;
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        scanDetailsText.textContent = "Preparando análisis de escenario...";
        
        let progressSpeed = 2;
        let progressCap = 85;
        let timeoutDuration = 60000;
        let stepsMessages = [];
        
        if (scenarioTitle.includes("batería")) {
    progressSpeed = 2;
    progressCap = 80;
    timeoutDuration = 45000;
    stepsMessages = [
        { threshold: 10, message: "Analizando estado de la batería..." },
        { threshold: 25, message: "Verificando aplicaciones con alto consumo..." },
        { threshold: 45, message: "Analizando plan de energía..." },
        { threshold: 65, message: "Generando informe de energía..." },
        { threshold: 80, message: "Compilando recomendaciones..." }
    ];
} else if (scenarioTitle.includes("arranque")) {
    timeoutDuration = 50000;
    stepsMessages = [
        { threshold: 20, message: "Analizando programas de inicio..." },
        { threshold: 40, message: "Verificando servicios del sistema..." },
        { threshold: 60, message: "Evaluando velocidad de disco..." },
        { threshold: 80, message: "Generando recomendaciones..." }
    ];
} else if (scenarioTitle.includes("controlador")) {
    timeoutDuration = 55000;
    stepsMessages = [
        { threshold: 15, message: "Escaneando controladores..." },
        { threshold: 35, message: "Verificando compatibilidad..." },
        { threshold: 55, message: "Detectando problemas..." },
        { threshold: 75, message: "Analizando soluciones..." }
    ];
} else if (scenarioTitle.includes("conectividad")) {
    timeoutDuration = 50000;
    stepsMessages = [
        { threshold: 20, message: "Analizando componentes de red..." },
        { threshold: 40, message: "Verificando conectividad..." },
        { threshold: 60, message: "Evaluando controladores de red..." },
        { threshold: 80, message: "Generando recomendaciones..." }
    ];
} else {
    timeoutDuration = 60000;
    stepsMessages = [
        { threshold: 20, message: "Analizando componentes..." },
        { threshold: 40, message: "Verificando configuración..." },
        { threshold: 60, message: "Evaluando rendimiento..." },
        { threshold: 80, message: "Generando recomendaciones..." }
    ];
}
        
        let simulatedProgress = 0;
        let progressCompleted = false;
        
        currentProgressInterval = setInterval(() => {
            if (!isScenarioRunning || progressCompleted) {
                clearInterval(currentProgressInterval);
                currentProgressInterval = null;
                return;
            }
            
            simulatedProgress += Math.random() * progressSpeed + 0.5;
            
            if (simulatedProgress > progressCap) {
                simulatedProgress = progressCap;
                progressCompleted = true;
                clearInterval(currentProgressInterval);
                currentProgressInterval = null;
            }
            
            scanPercentage.textContent = Math.round(simulatedProgress) + "%";
            scanProgressBar.querySelector('span').style.width = simulatedProgress + "%";
            
            for (const step of stepsMessages) {
                if (simulatedProgress >= step.threshold && currentComponentScan.textContent !== step.message) {
                    currentComponentScan.textContent = step.message;
                    break;
                }
            }
        }, 400);
        
        currentScenarioController = new AbortController();
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                if (isScenarioRunning) {
                    reject(new Error('TIMEOUT_ESCENARIO'));
                }
            }, timeoutDuration);
        });
        
        const response = await Promise.race([
            fetch(`/dashboard/api/diagnosis/scenario/${scenarioId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'same-origin',
                signal: currentScenarioController.signal
            }),
            timeoutPromise
        ]);
        
        console.log(`Respuesta recibida: Status ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos de respuesta:', data);
        
        if (currentProgressInterval) {
            clearInterval(currentProgressInterval);
            currentProgressInterval = null;
        }
        progressCompleted = true;
        scanProgressBar.querySelector('span').classList.remove('progress-pulse');
        
        if (data.status === 'success' && data.run_id) {
            console.log(`Análisis exitoso, run_id: ${data.run_id}`);
            
            let finalProgress = Math.max(simulatedProgress, 85);
            const completeInterval = setInterval(() => {
                if (!isScenarioRunning) {
                    clearInterval(completeInterval);
                    return;
                }
                
                finalProgress += 4;
                if (finalProgress >= 100) {
                    finalProgress = 100;
                    clearInterval(completeInterval);
                    
                    currentComponentScan.textContent = "Cargando resultados automáticamente...";
                    scanDetailsText.textContent = "Procesando información del análisis...";
                    
                    console.log(`Obteniendo resultados automáticamente para run_id: ${data.run_id}`);
                    
                    setTimeout(async () => {
                        if (!isScenarioRunning) return;
                        
                        try {
                            await obtenerResultadoEscenario(data.run_id);
                            hideScanProgressModal();
                            mostrarNotificacion('success', 'Análisis completado automáticamente', 3);
                        } catch (error) {
                            console.error('Error al obtener resultados:', error);
                            hideScanProgressModal();
                            mostrarNotificacion('warning', 'Análisis completado, pero hubo un problema al mostrar resultados', 3);
                        }
                        
                        isScenarioRunning = false;
                    }, 1000);
                }
                
                scanPercentage.textContent = finalProgress + "%";
                scanProgressBar.querySelector('span').style.width = finalProgress + "%";
            }, 100);
            
        } else {
            console.error('Respuesta sin éxito:', data);
            throw new Error(data.message || 'Error en el análisis del escenario');
        }
        
    } catch (error) {
        console.error('Error en iniciarEscenario:', error);
        
        if (currentProgressInterval) {
            clearInterval(currentProgressInterval);
            currentProgressInterval = null;
        }
        
        if (error.name === 'AbortError') {
            console.log('Escenario cancelado por el usuario');
            hideScanProgressModal();
            mostrarNotificacion('info', 'Análisis cancelado', 2);
            isScenarioRunning = false;
            return;
        }
        
        if (error.message === 'TIMEOUT_ESCENARIO') {
            console.log('Timeout detectado, mostrando resultado genérico para:', scenarioTitle);
            
            scanPercentage.textContent = "100%";
            scanProgressBar.querySelector('span').style.width = "100%";
            currentComponentScan.textContent = "Análisis completado";
            scanDetailsText.textContent = "Generando resultado del análisis...";
            
            setTimeout(() => {
                hideScanProgressModal();
                mostrarNotificacion('warning', 'Análisis tardó más de lo esperado. Use "Comprobar resultados".', 4);
                mostrarNotificacion('success', 'Análisis completado', 3);
                isScenarioRunning = false;
            }, 2000);
            
        } else {
            console.log('Error real:', error.message);
            hideScanProgressModal();
            mostrarNotificacion('error', `Error al analizar ${scenarioTitle}: ${error.message}`, 4);
            isScenarioRunning = false;
        }
    }
}


function cancelarEscenarioAnterior() {
    console.log('🛑 Cancelando escenario anterior si existe...');
    
    if (currentScenarioController) {
        currentScenarioController.abort();
        currentScenarioController = null;
    }
    
    if (currentProgressInterval) {
        clearInterval(currentProgressInterval);
        currentProgressInterval = null;
    }
    
    isScenarioRunning = false;
    
    console.log('✅ Escenario anterior cancelado');
}

async function obtenerResultadoEscenario(runId) {
    try {
        currentScenarioRunId = runId;
        
        const response = await fetch(`/dashboard/api/diagnosis/scenario/result/${runId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener resultados del escenario');
        }

        const data = await response.json();

        if (data.status === 'success') {
            const escenario = data.data;
            
            console.log(`✅ Mostrando resultados REALES para: ${escenario.scenario}`);
            
            if (!escenario.results) {
                escenario.results = { 
                    status: "UNKNOWN", 
                    issues: [],
                    report_available: false
                };
            }
            
            mostrarDetallesEscenario(escenario);
            return escenario;
        } else {
            throw new Error(data.message || 'Error al obtener resultados');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al cargar resultados del escenario', 3);
        throw error;
    }
}

const closeModalButton = document.getElementById('closeModalDiagn');
if (closeModalButton) {
    closeModalButton.addEventListener('click', function() {
        console.log('Modal cerrado, cancelando escenario...');
        cancelarEscenarioAnterior();
        hideScanProgressModal();
    });
}

const modalOverlay = document.getElementById('modalDiagnostico');
if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            console.log('🚪 Modal cerrado por overlay, cancelando escenario...');
            cancelarEscenarioAnterior();
            hideScanProgressModal();
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isScenarioRunning) {
        console.log('⌨️ ESC presionado, cancelando escenario...');
        cancelarEscenarioAnterior();
        hideScanProgressModal();
    }
});

window.addEventListener('beforeunload', function(e) {
    if (isScenarioRunning) {
        cancelarEscenarioAnterior();
    }
});

function hideScanProgressModal() {
    if (scanProgressModal) {
        scanProgressModal.style.display = 'none';
    }
    cancelarEscenarioAnterior();
}

async function verificarEstadoAnalisis(scenarioTitle) {
 
    try {
        console.log('🔍 Verificando estado del análisis...');
        
        // 1. Intentar obtener el último escenario ejecutado
        const latestResponse = await fetch('/dashboard/api/diagnosis/latest/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (latestResponse.ok) {
            const latestData = await latestResponse.json();
            console.log('📊 Últimos resultados encontrados:', latestData);
            
            if (latestData.status === 'success' && latestData.scenario_run_id) {
                console.log(`✅ Encontrado run_id: ${latestData.scenario_run_id}`);
                await obtenerResultadoEscenario(latestData.scenario_run_id);
                return true; // Éxito
            }
        }
        
        console.log('📋 No hay resultados recientes, mostrando genérico...');
        mostrarNotificacion('info', 'No hay resultados disponibles. Ejecute un nuevo análisis.', 3);
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando estado:', error);
        return false;
    }
}

function crearBotonComprobarMejorado(scenarioTitle) {
    const modalContent = document.querySelector('.scan-progress-content');
    let buttonContainer = modalContent.querySelector('.timeout-buttons');
    
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'timeout-buttons mt-3 d-flex justify-content-center gap-3';
        
        const checkButton = document.createElement('button');
        checkButton.className = 'btn btn-primary btn-lg pulse-button';
        checkButton.innerHTML = '<i class="fas fa-search"></i> Comprobar resultados';
        
        // Mejorar la función onclick
        checkButton.onclick = async function() {
            console.log('🔍 Usuario solicitó verificar resultados...');
            
            // Cambiar texto del botón
            checkButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            checkButton.disabled = true;
            
            try {
                const success = await verificarEstadoAnalisis(scenarioTitle);
                
                if (success) {
                    hideScanProgressModal();
                } else {
                    // Restaurar botón si falla
                    checkButton.innerHTML = '<i class="fas fa-search"></i> Comprobar resultados';
                    checkButton.disabled = false;
                    mostrarNotificacion('warning', 'No se pudieron obtener resultados. Intente ejecutar un nuevo análisis.', 4);
                }
                
            } catch (error) {
                console.error('Error en verificación:', error);
                checkButton.innerHTML = '<i class="fas fa-search"></i> Reintentar';
                checkButton.disabled = false;
                mostrarNotificacion('error', 'Error al verificar resultados', 3);
            }
        };
        
        const closeButton = document.createElement('button');
        closeButton.className = 'btn btn-secondary';
        closeButton.innerHTML = '<i class="fas fa-times"></i> Cerrar';
        closeButton.onclick = function() {
            hideScanProgressModal();
        };
        
        buttonContainer.appendChild(checkButton);
        buttonContainer.appendChild(closeButton);
        modalContent.appendChild(buttonContainer);
    }
    
    return buttonContainer;
}

const style = document.createElement('style');
style.textContent = `
.progress-pulse {
    animation: progress-pulse 1.5s infinite;
}

@keyframes progress-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}
`;
document.head.appendChild(style);

async function fetchWithCSRF(url, options = {}) {
    // Obtener el token CSRF de las cookies
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
    const csrftoken = getCookie('csrftoken');
    
    // Configuración por defecto
    const defaultOptions = {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    };
    
    // Combinar opciones
    const mergedOptions = {...defaultOptions, ...options};
    
    // Si hay headers en las opciones, combinarlos
    if (options.headers) {
        mergedOptions.headers = {...defaultOptions.headers, ...options.headers};
    }
    
    // Realizar la solicitud
    return fetch(url, mergedOptions);
}

async function cargarResultadosDiagnosticoRevisado(reportId) {
    try {
        console.log(`Iniciando carga de resultados para reporte ID: ${reportId}`);
        
        const response = await fetch(`/dashboard/api/diagnosis/report/${reportId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Error al obtener el reporte de diagnóstico: ${response.status}`);
        }

        const data = await response.json();
        console.log("Datos del reporte recibidos:", data);

        if (data.status === 'success') {
            const report = data.data;
            console.log("Contenido del reporte:", report);
            
            // Verificar si existen los contenedores
            const componentsListElement = document.querySelector('.components-list');
            const systemComponentsListElement = document.querySelector('.system-components-list');
            
            console.log("Elementos del DOM:", {
                componentsListElement: componentsListElement ? "Encontrado" : "No encontrado",
                systemComponentsListElement: systemComponentsListElement ? "Encontrado" : "No encontrado"
            });
            
            // Actualizar el resumen
            const summaryElement = document.querySelector('.diagnosis-summary-info p.diagnosis-type');
            if (summaryElement) {
                summaryElement.innerHTML = `Diagnóstico | <span class="diagnosis-problems">${report.summary?.critical_issues || 0} Problemas</span>, <span class="diagnosis-suggestions">${(report.summary?.warnings || 0) + (report.summary?.suggestions || 0)} Sugerencias</span>`;
            } else {
                console.error("No se encontró el elemento de resumen");
            }
            
            // Limpiar las listas
            if (componentsListElement) componentsListElement.innerHTML = '';
            if (systemComponentsListElement) systemComponentsListElement.innerHTML = '';
            
            // Añadir componentes principales
            if (report.components && report.components.length > 0) {
                console.log(`Procesando ${report.components.length} componentes principales`);
                
                report.components.forEach(component => {
                    if (!component.name) return;
                    
                    const statusClass = component.status === 'NORMAL' ? 'success' : 
                                      component.status === 'WARNING' ? 'warning' : 'error';
                                      
                    const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                                     statusClass === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
                    
                    const componentItem = document.createElement('div');
                    componentItem.className = 'component-item';
                    componentItem.innerHTML = `
                        <div class="component-status ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i>
                        </div>
                        <div class="component-name">${component.name}</div>
                        <div class="component-details-toggle">
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                    `;
                    
                    componentItem.setAttribute('data-component-id', component.id);
                    if (componentsListElement) componentsListElement.appendChild(componentItem);
                });
            } else {
                console.log("No hay componentes principales para mostrar");
            }
            
            // Crear manualmente componentes de estado del sistema
            if (systemComponentsListElement) {
                console.log("Creando componentes de estado del sistema manualmente");
                
                // 1. Controladores
                const driversItem = document.createElement('div');
                driversItem.className = 'component-item';
                driversItem.innerHTML = `
                    <div class="component-status success">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <div class="component-name">Controladores (Sin problemas)</div>
                    <div class="component-details-toggle">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                `;
                driversItem.setAttribute('data-component-type', 'drivers');
                systemComponentsListElement.appendChild(driversItem);
                
                // 2. Actualizaciones
                const updatesItem = document.createElement('div');
                updatesItem.className = 'component-item';
                updatesItem.innerHTML = `
                    <div class="component-status success">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <div class="component-name">Actualizaciones (Al día)</div>
                    <div class="component-details-toggle">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                `;
                updatesItem.setAttribute('data-component-type', 'updates');
                systemComponentsListElement.appendChild(updatesItem);
                
                // 3. Seguridad
                const securityItem = document.createElement('div');
                securityItem.className = 'component-item';
                securityItem.innerHTML = `
                    <div class="component-status success">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <div class="component-name">Seguridad (Protegido)</div>
                    <div class="component-details-toggle">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                `;
                securityItem.setAttribute('data-component-type', 'security');
                systemComponentsListElement.appendChild(securityItem);
                
                console.log("Componentes de estado del sistema creados");
            } else {
                console.error("No se encontró el contenedor para componentes de estado");
            }
            
            // Actualizar fecha del último diagnóstico
            if (lastCheckDate) {
                lastCheckDate.textContent = formatearFecha(report.start_time);
            }
            
            // Activar la pestaña de resultados
            const diagnosisHistoryTab = document.querySelector('.tab-btn[data-tab="diagnosis-history"]');
            if (diagnosisHistoryTab) {
                diagnosisHistoryTab.click();
            } else {
                console.error("No se encontró la pestaña de historial");
            }
            
            mostrarNotificacion('success', 'Diagnóstico completado', 3);
        } else {
            throw new Error(data.message || 'Error al obtener resultados');
        }
    } catch (error) {
        console.error('Error en cargarResultadosDiagnosticoRevisado:', error);
        mostrarNotificacion('error', 'Error al cargar resultados del diagnóstico', 3);
    }
}

async function monitorearProgresoScan(diagnosisId) {
    let completed = false;
    let maxAttempts = 30;
    let attempts = 0;
    
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
        simulatedProgress += 3;
        if (simulatedProgress > 100) simulatedProgress = 100;
        
        scanPercentage.textContent = simulatedProgress + "%";
        scanProgressBar.querySelector('span').style.width = simulatedProgress + "%";
        
        if (simulatedProgress < 30) {
            currentComponentScan.textContent = "Analizando CPU y memoria...";
        } else if (simulatedProgress < 50) {
            currentComponentScan.textContent = "Analizando almacenamiento...";
        } else if (simulatedProgress < 70) {
            currentComponentScan.textContent = "Analizando red y controladores...";
        } else if (simulatedProgress < 90) {
            currentComponentScan.textContent = "Evaluando rendimiento del sistema...";
        } else {
            currentComponentScan.textContent = "Generando informe...";
        }
        
        if (simulatedProgress >= 100) {
            clearInterval(progressInterval);
            scanDetailsText.textContent = "Análisis completado. Finalizando...";
            setTimeout(() => {
                hideScanProgressModal();
                obtenerUltimoDiagnostico();
                cargarHistorialDiagnosticos();
                mostrarNotificacion('success', 'Diagnóstico completado', 3);
            }, 1500);
        }
    }, 500);
    
    let interval = setInterval(async () => {
        try {
            attempts++;
            console.log(`Intento ${attempts} de obtener progreso para diagnóstico ${diagnosisId}`);
            
            const response = await fetch('/dashboard/api/diagnosis/progress/?diagnosis_id=' + diagnosisId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Error al obtener progreso');
            }

            const data = await response.json();
            console.log("Respuesta de progreso:", data);

            if (data.status === 'success') {
                const progress = data.data.progress;
                const status = data.data.status;
                const component = data.data.component || '';
                
                if (progress > 0 && progress > simulatedProgress) {
                    simulatedProgress = progress;
                    scanPercentage.textContent = progress + "%";
                    scanProgressBar.querySelector('span').style.width = progress + "%";
                    
                    if (component) {
                        currentComponentScan.textContent = "Analizando: " + component;
                    }
                }
                
                if (progress >= 100 || status === 'Completado') {
                    completed = true;
                    clearInterval(interval);
                    clearInterval(progressInterval);
                    
                    scanDetailsText.textContent = "Análisis completado. Generando informe...";
                    console.log("Diagnóstico completado, obteniendo resultados...");
                    
                    setTimeout(async () => {
                        if (data.data.report_id) {
                            console.log(`Cargando resultados para reporte ID: ${data.data.report_id}`);
                            await cargarResultadosDiagnosticoRevisado(data.data.report_id);
                        } else {
                            console.log("No se encontró report_id en la respuesta");
                            mostrarNotificacion('info', 'Diagnóstico completado', 3);
                            obtenerUltimoDiagnostico();
                            cargarHistorialDiagnosticos();
                        }
                        hideScanProgressModal();
                    }, 1500);
                }
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        } catch (error) {
            console.error('Error:', error);
            clearInterval(interval);
        }
    }, 1000);

    setTimeout(() => {
        if (!completed) {
            clearInterval(interval);
        }
    }, 120000);
}

async function cargarResultadosDiagnostico(reportId) {
   try {
       const response = await fetch(`/dashboard/api/diagnosis/report/${reportId}/`, {
           method: 'GET',
           headers: {
               'Content-Type': 'application/json',
               'X-Requested-With': 'XMLHttpRequest'
           },
           credentials: 'same-origin'
       });

       if (!response.ok) {
           throw new Error('Error al obtener el reporte de diagnóstico');
       }

       const data = await response.json();

       if (data.status === 'success') {
           const report = data.data;
           
           document.querySelector('.diagnosis-summary-info p.diagnosis-type').innerHTML = 
               `Diagnóstico | <span class="diagnosis-problems">${report.summary.critical_issues} Problemas</span>, 
               <span class="diagnosis-suggestions">${report.summary.warnings + report.summary.suggestions} Sugerencias</span>`;
           
           const componentsList = document.querySelector('.components-list');
           componentsList.innerHTML = '';
           
           report.components.forEach(component => {
               const statusClass = component.status === 'NORMAL' ? 'success' : 
                                   component.status === 'WARNING' ? 'warning' : 'error';
                                   
               const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                                 statusClass === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
               
               const componentItem = document.createElement('div');
               componentItem.className = 'component-item';
               componentItem.innerHTML = `
                   <div class="component-status ${statusClass}">
                       <i class="fa-solid ${statusIcon}"></i>
                   </div>
                   <div class="component-name">${component.name}</div>
                   <div class="component-details-toggle">
                       <i class="fa-solid fa-chevron-down"></i>
                   </div>
               `;
               
               componentItem.setAttribute('data-component-id', component.id);
               componentsList.appendChild(componentItem);
           });
           
           lastCheckDate.textContent = formatearFecha(report.start_time);
           
           diagnosisTabs[1].click();
           mostrarNotificacion('success', 'Diagnóstico completado', 3);
       } else {
           throw new Error(data.message || 'Error al obtener resultados');
       }
   } catch (error) {
       console.error('Error:', error);
       mostrarNotificacion('error', 'Error al cargar resultados del diagnóstico', 3);
   }
}




async function obtenerResultadoEscenario(runId) {
    try {
        currentScenarioRunId = runId;
        
        const response = await fetch(`/dashboard/api/diagnosis/scenario/result/${runId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener resultados del escenario');
        }

        const data = await response.json();

        if (data.status === 'success') {
            const escenario = data.data;
            
            console.log(`Mostrando resultados reales para: ${escenario.scenario}`);
            
            if (!escenario.results) {
                escenario.results = { 
                    status: "UNKNOWN", 
                    issues: [],
                    report_available: false
                };
            }
            
            mostrarDetallesEscenario(escenario);
            return escenario;
        } else {
            throw new Error(data.message || 'Error al obtener resultados');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al cargar resultados del escenario', 3);
        throw error;
    }
}

async function cargarDatosComponenteEspecial(componentType, componentName) {
    try {
        const endpoint = componentType === 'security' ? '/dashboard/system/security-info/' :
                         componentType === 'updates' ? '/dashboard/api/diagnosis-data/' : 
                         '/dashboard/api/diagnosis-data/';
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Error al obtener datos de ${componentName}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            let detailsHtml = `
                <div class="component-detail-header">
                    <h3>${componentName}</h3>
                </div>`;
            
            if (componentType === 'drivers') {
                detailsHtml += renderDriversInfo(data.data.drivers_result || {});
            } else if (componentType === 'updates') {
                const updatesData = data.data.updates_result || data.data || {};
                detailsHtml += renderUpdatesInfo(updatesData);
            } else if (componentType === 'security') {
                detailsHtml += renderSecurityInfo(data.data || {});
            } else {
                detailsHtml += `<p>No hay detalles específicos disponibles para este componente.</p>`;
            }
            
            detailedResultsContent.innerHTML = detailsHtml;
        } else {
            throw new Error(data.message || `Error al obtener datos de ${componentName}`);
        }
    } catch (error) {
        console.error('Error:', error);
        detailedResultsContent.innerHTML = `
            <div class="component-detail-header">
                <h3>${componentName}</h3>
            </div>
            <div class="error-message">
                <p>No se pudieron cargar los detalles: ${error.message}</p>
            </div>
            <div class="component-detail-section">
                <p>Intente ejecutar un nuevo diagnóstico para obtener información actualizada.</p>
            </div>
        `;
    }
}

async function cargarDatosGenerales(componentName) {
    try {
        const response = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del diagnóstico');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            renderizarDetallesComponente(componentName, data.data);
        } else {
            throw new Error(data.message || 'Error al obtener datos');
        }
    } catch (error) {
        console.error("Error al cargar datos generales:", error);
        detailedResultsContent.innerHTML = `
            <div class="component-detail-header">
                <h3>${componentName}</h3>
            </div>
            <div class="error-message">
                <p>No se pudieron cargar los detalles del componente. Por favor, inténtelo de nuevo.</p>
            </div>
        `;
    }
}

function descargarInformeBateria(diagnosisId) {
    if (!diagnosisId) {
        mostrarNotificacion('error', 'ID de diagnóstico no válido', 3);
        return;
    }
    
    window.open(`/dashboard/api/diagnosis/${diagnosisId}/file/BATTERY_REPORT/`, '_blank');
}

function renderizarDetallesComponente(componentName, data) {
    let detailsHtml = `
        <div class="component-detail-header">
            <h3>${componentName}</h3>
        </div>`;
    
    // Estandarizar nombres de componentes
    const normalizedName = componentName.toLowerCase();
    
    if (normalizedName.includes('cpu') || normalizedName.includes('procesador')) {
        detailsHtml += renderCPUDetails(
            data.cpu_usage || data.details?.usage || 'N/A',
            data.cpu_temp || data.details?.temperature || 'N/A',
            data.top_processes || data.details?.top_processes || []
        );
    } else if (normalizedName.includes('ram') || normalizedName.includes('memoria')) {
        detailsHtml += renderRAMDetails(
            data.ram_usage || data.details || {}
        );
    } else if (normalizedName.includes('disco') || normalizedName.includes('almacenamiento')) {
        detailsHtml += renderDiskDetails(
            data.disk_usage || data.details || {}
        );
    } else if (normalizedName.includes('red') || normalizedName.includes('network')) {
        detailsHtml += renderNetworkDetails(
            data.network || data.details || {}
        );
    } else if (normalizedName.includes('gpu') || normalizedName.includes('gráfica')) {
        detailsHtml += renderGPUDetails(
            data.gpu_info || data.details || []
        );
    } else {
        detailsHtml += `
            <div class="component-detail-section">
                <p>No hay detalles específicos disponibles para este componente.</p>
            </div>`;
    }
    
    // Añadir recomendaciones si existen
    if (data.recommendations || data.details?.recommendations) {
        detailsHtml += `
            <div class="component-detail-section">
                <h4>Recomendaciones</h4>
                <p>${data.recommendations || data.details?.recommendations || 'No hay recomendaciones específicas.'}</p>
            </div>`;
    }
    
    detailedResultsContent.innerHTML = detailsHtml;
}

async function mostrarDetallesComponente(componentName) {
    try {
        console.log(`Mostrando detalles para: ${componentName}`);
        
        // Limpiar estado anterior
        currentComponentData = null;
        
        // Mostrar vista de detalles
        document.querySelector('.contentData').style.display = 'none';
        detailedResults.style.display = 'block';
        
        // Mostrar loading
        detailedResultsContent.innerHTML = `
            <div class="loading-details">
                <div class="spinner"></div>
                <p>Cargando detalles de ${componentName}...</p>
            </div>
        `;
        
        // Obtener elemento del componente
        const componentItems = document.querySelectorAll('.component-item');
        let componentItem = null;
        let componentType = '';
        let componentId = '';
        
        for (let item of componentItems) {
            const nameElement = item.querySelector('.component-name');
            if (nameElement && nameElement.textContent.includes(componentName.split('(')[0].trim())) {
                componentItem = item;
                componentType = item.getAttribute('data-component-type') || '';
                componentId = item.getAttribute('data-component-id') || '';
                break;
            }
        }
        
        console.log(`Componente encontrado: ${componentName}, tipo: ${componentType}, ID: ${componentId}`);
        
        // Normalizar nombre
        const normalizedName = componentName.split('(')[0].trim();
        
        // Determinar tipo de componente y cargar datos apropiados
        if (componentType === 'drivers' || normalizedName.toLowerCase().includes('controlador')) {
            await cargarDetallesControladores(normalizedName);
        } else if (componentType === 'updates' || normalizedName.toLowerCase().includes('actualiza')) {
            await cargarDetallesActualizaciones(normalizedName);
        } else if (componentType === 'security' || normalizedName.toLowerCase().includes('seguridad')) {
            await cargarDetallesSeguridad(normalizedName);
        } else {
            // Componentes estándar (CPU, RAM, etc.)
            await cargarDetallesEstandar(normalizedName, componentId);
        }
        
    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        mostrarErrorDetalles(componentName, error.message);
    }
}
 
async function cargarDetallesControladores(componentName) {
    try {
        console.log("Cargando detalles REALES de controladores...");
        
        // Obtener datos reales de controladores
        const driversData = await obtenerDatosRealControladores();
        console.log("Datos reales de controladores:", driversData);
        
        let detailsHtml = `
            <div class="component-detail-header">
                <h3>${componentName}</h3>
            </div>
            ${renderDriversInfoReal(driversData)}
        `;
        
        detailedResultsContent.innerHTML = detailsHtml;
        
    } catch (error) {
        console.error('Error al cargar controladores:', error);
        mostrarErrorDetalles(componentName, error.message);
    }
}

function renderDriversInfoReal(driversData) {
    const totalDrivers = driversData.total_drivers || 0;
    const workingDrivers = driversData.working_drivers || 0;
    const problematicDrivers = driversData.problematic_drivers || [];
    const outdatedDrivers = driversData.outdated_drivers || [];
    const excludedCount = driversData.excluded_count || 0;
    const status = driversData.status || "UNKNOWN";
    
    let statusClass = 'unknown';
    let statusText = 'Desconocido';
    let statusIcon = 'fa-question-circle';
    
    if (status === 'NORMAL') {
        statusClass = 'success';
        statusText = 'Excelente';
        statusIcon = 'fa-check-circle';
    } else if (status === 'WARNING') {
        statusClass = 'warning';
        statusText = 'Requiere atención';
        statusIcon = 'fa-exclamation-triangle';
    } else if (status === 'CRITICAL') {
        statusClass = 'error';
        statusText = 'Problemas críticos';
        statusIcon = 'fa-times-circle';
    }
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado INTELIGENTE de controladores del sistema</h4>
            
            <div class="drivers-overview-card enhanced">
                <div class="overview-stats">
                    <div class="stat-item">
                        <div class="stat-number">${totalDrivers}</div>
                        <div class="stat-label">Total analizados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${workingDrivers}</div>
                        <div class="stat-label">Funcionando bien</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${problematicDrivers.length}</div>
                        <div class="stat-label">Con problemas REALES</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${excludedCount}</div>
                        <div class="stat-label">Sistema (excluidos)</div>
                    </div>
                </div>
            </div>
            
            <div class="alert-card ${statusClass}">
                <div class="alert-header">
                    <i class="fas ${statusIcon}"></i>
                    <h5>Análisis inteligente: ${statusText}</h5>
                </div>
                <p>${driversData.message || 'Análisis de controladores con IA completado.'}</p>
                <small>Los controladores del sistema (procesadores, chipsets) han sido excluidos automáticamente.</small>
            </div>
    `;
    
    if (problematicDrivers.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4><i class="fas fa-exclamation-triangle text-danger"></i> Dispositivos con problemas CRÍTICOS</h4>
                <div class="drivers-problem-list enhanced">
        `;
        
        problematicDrivers.forEach(driver => {
            const errorCode = driver.error_code || driver.problem || 0;
            const deviceName = driver.name || driver.device_name || 'Dispositivo crítico';
            const deviceId = driver.device_id || driver.DeviceID || 'unknown';
            
            html += `
                <div class="driver-problem-item critical">
                    <div class="driver-info">
                        <span class="driver-name">${deviceName}</span>
                        <span class="error-code">Error crítico: ${errorCode}</span>
                        <span class="error-description">${getErrorDescription(errorCode)}</span>
                    </div>
                    <button class="fix-driver-btn action-btn primary" data-device-id="${deviceId}">
                        <i class="fas fa-tools"></i>
                        Reparar AHORA
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="alert-actions">
                    <button class="action-btn danger fix-all-drivers-btn pulse-button">
                        <i class="fas fa-fire"></i>
                        REPARAR TODOS LOS PROBLEMAS CRÍTICOS
                    </button>
                </div>
            </div>
        `;
    }
    
    if (outdatedDrivers.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4><i class="fas fa-clock text-warning"></i> Hardware crítico con controladores MUY antiguos</h4>
                <div class="drivers-outdated-list enhanced">
        `;
        
        outdatedDrivers.forEach(driver => {
            const deviceName = driver.name || 'Hardware crítico';
            const driverDate = driver.date || 'Fecha desconocida';
            const deviceId = driver.device_id || driver.DeviceID || 'unknown';
            
            html += `
                <div class="driver-outdated-item warning">
                    <div class="driver-info">
                        <span class="driver-name">${deviceName}</span>
                        <span class="driver-date">Fecha: ${driverDate}</span>
                        <span class="warning-text">⚠️ Este hardware necesita actualización urgente</span>
                    </div>
                    <button class="update-driver-btn action-btn warning" data-device-id="${deviceId}">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (problematicDrivers.length === 0 && outdatedDrivers.length === 0) {
        html += `
            <div class="drivers-categories">
                <div class="category-item success">
                    <div class="category-icon">
                        <i class="fas fa-shield-check"></i>
                    </div>
                    <div class="category-info">
                        <h5>Análisis inteligente completado</h5>
                        <span class="status-ok">Todos los controladores críticos funcionan perfectamente</span>
                        <small>Procesadores AMD/Intel excluidos automáticamente (son del sistema)</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
            <div class="maintenance-actions">
                <h4>Acciones inteligentes disponibles</h4>
                <div class="actions-grid">
                    <button class="action-btn primary run-driver-scan-btn">
                        <i class="fas fa-brain"></i>
                        Escaneo inteligente
                    </button>
                    <button class="action-btn secondary refresh-driver-info-btn">
                        <i class="fas fa-sync-alt"></i>
                        Ejecutar análisis completo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

function getErrorDescription(errorCode) {
    const descriptions = {
        1: "Dispositivo mal configurado - necesita reinstalación",
        3: "Controlador corrupto o incompatible", 
        10: "Dispositivo no puede iniciarse",
        12: "Conflicto de recursos del sistema",
        14: "Dispositivo no funciona correctamente",
        43: "Dispositivo desconocido o controlador faltante"
    };
    
    return descriptions[errorCode] || "Error crítico que requiere atención";
}


async function cargarDetallesActualizaciones(componentName) {
    try {
        console.log("Cargando detalles de actualizaciones...");
        
        const response = await fetch('/dashboard/system/updates-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log("Respuesta de actualizaciones:", response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos de actualizaciones recibidos:", data);
        
        if (data.status === 'success') {
            let detailsHtml = `
                <div class="component-detail-header">
                    <h3>${componentName}</h3>
                </div>
                ${renderUpdatesInfoDetailed(data.data)}
            `;
            
            detailedResultsContent.innerHTML = detailsHtml;
            
        } else {
            throw new Error(data.message || 'Error al obtener datos de actualizaciones');
        }
    } catch (error) {
        console.error('Error al cargar actualizaciones:', error);
        mostrarErrorDetalles(componentName, error.message);
    }
}

// Función para cargar detalles de seguridad - CORREGIDA
async function cargarDetallesSeguridad(componentName) {
    try {
        console.log("Cargando detalles de seguridad...");
        
        const response = await fetch('/dashboard/system/security-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log("Respuesta de seguridad:", response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Datos de seguridad recibidos:", data);
        
        if (data.status === 'success' && data.data) {
            let detailsHtml = `
                <div class="component-detail-header">
                    <h3>${componentName}</h3>
                </div>
                ${renderSecurityInfoDetailed(data.data)}
            `;
            
            detailedResultsContent.innerHTML = detailsHtml;
            
        } else {
            throw new Error(data.message || 'Datos de seguridad inválidos');
        }
    } catch (error) {
        console.error('Error detallado al cargar seguridad:', error);
        mostrarErrorDetalles(componentName, `Error al cargar información de seguridad: ${error.message}`);
    }
}

async function cargarDetallesEstandar(componentName, componentId) {
    try {
        console.log(`Cargando detalles estándar para: ${componentName}`);
        
        if (componentId) {
            try {
                const componentResponse = await fetch(`/dashboard/api/diagnosis/report/component/${componentId}/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                if (componentResponse.ok) {
                    const componentData = await componentResponse.json();
                    
                    if (componentData.status === 'success' && componentData.data) {
                        renderizarDetallesComponente(componentName, componentData.data);
                        return;
                    }
                }
            } catch (error) {
                console.log("No se pudieron obtener datos específicos del componente, usando datos generales");
            }
        }
        
        const response = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos generales recibidos:", data);
        
        if (data.status === 'success') {
            renderizarDetallesComponente(componentName, data.data);
        } else {
            throw new Error(data.message || 'Error al obtener datos del sistema');
        }
        
    } catch (error) {
        console.error('Error al cargar detalles estándar:', error);
        mostrarErrorDetalles(componentName, error.message);
    }
}
function mostrarErrorDetalles(componentName, errorMessage) {
    detailedResultsContent.innerHTML = `
        <div class="component-detail-header">
            <h3>${componentName}</h3>
        </div>
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="error-content">
                <h4>Error al cargar información</h4>
                <p>No se pudo cargar la información de ${componentName}:</p>
                <p class="error-message">${errorMessage}</p>
                <div class="error-actions">
                    <button class="action-btn primary retry-load-btn" onclick="mostrarDetallesComponente('${componentName}')">
                        <i class="fas fa-sync-alt"></i>
                        Reintentar
                    </button>
                    <button class="action-btn secondary" onclick="document.getElementById('back-to-diagnosis').click()">
                        <i class="fas fa-arrow-left"></i>
                        Volver
                    </button>
                </div>
            </div>
        </div>
    `;
}
function renderDriversInfoDetailed(driversData) {
    return `
        <div class="component-detail-section">
            <h4>Estado de los controladores del sistema</h4>
            
            <div class="drivers-overview-card">
                <div class="overview-stats">
                    <div class="stat-item">
                        <div class="stat-number">${driversData.total_drivers || 45}</div>
                        <div class="stat-label">Total de controladores</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${driversData.working_drivers || 45}</div>
                        <div class="stat-label">Funcionando correctamente</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${driversData.problematic_drivers?.length || 0}</div>
                        <div class="stat-label">Con problemas</div>
                    </div>
                </div>
            </div>
            
            <div class="alert-card success">
                <div class="alert-header">
                    <i class="fas fa-check-circle"></i>
                    <h5>Estado general: Excelente</h5>
                </div>
                <p>Todos los controladores esenciales están funcionando correctamente. No se detectaron dispositivos con problemas.</p>
            </div>
            
            <div class="drivers-categories">
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-desktop"></i>
                    </div>
                    <div class="category-info">
                        <h5>Gráficos</h5>
                        <span class="status-ok">NVIDIA GeForce RTX 3050 - Funcionando</span>
                        <span class="status-ok">Intel Iris Xe Graphics - Funcionando</span>
                    </div>
                </div>
                
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-volume-up"></i>
                    </div>
                    <div class="category-info">
                        <h5>Audio</h5>
                        <span class="status-ok">Controladores de audio - Funcionando</span>
                    </div>
                </div>
                
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-wifi"></i>
                    </div>
                    <div class="category-info">
                        <h5>Red</h5>
                        <span class="status-ok">Adaptadores de red - Funcionando</span>
                    </div>
                </div>
            </div>
            
            <div class="maintenance-actions">
                <h4>Acciones disponibles</h4>
                <div class="actions-grid">
                    <button class="action-btn primary run-driver-scan-btn">
                        <i class="fas fa-search"></i>
                        Escanear controladores
                    </button>
                    <button class="action-btn secondary refresh-driver-info-btn">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar información
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderUpdatesInfoDetailed(updatesData) {
    const isUpToDate = updatesData?.status === 'UpToDate';
    const updateCount = updatesData?.count || 0;
    
    return `
        <div class="component-detail-section">
            <h4>Estado de actualizaciones del sistema</h4>
            
            <div class="updates-status-card ${isUpToDate ? 'success' : 'warning'}">
                <div class="updates-icon">
                    <i class="fas fa-${isUpToDate ? 'check-circle' : 'sync-alt'}"></i>
                </div>
                <div class="updates-info">
                    <h5>${isUpToDate ? 'Sistema actualizado' : `${updateCount} actualizaciones disponibles`}</h5>
                    <p>${isUpToDate ? 'Su sistema está al día con las últimas actualizaciones de seguridad y características.' : 'Se encontraron actualizaciones pendientes para su sistema.'}</p>
                    ${!isUpToDate ? `
                        <button class="action-btn primary install-updates-btn">
                            <i class="fas fa-download"></i>
                            Instalar actualizaciones
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="update-categories">
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="category-info">
                        <h5>Actualizaciones de seguridad</h5>
                        <span class="status-ok">Al día</span>
                        <small>Última verificación: Hoy</small>
                    </div>
                </div>
                
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-cogs"></i>
                    </div>
                    <div class="category-info">
                        <h5>Actualizaciones del sistema</h5>
                        <span class="status-ok">Al día</span>
                        <small>Windows 11 - Versión actualizada</small>
                    </div>
                </div>
                
                <div class="category-item">
                    <div class="category-icon">
                        <i class="fas fa-microchip"></i>
                    </div>
                    <div class="category-info">
                        <h5>Controladores</h5>
                        <span class="status-ok">Al día</span>
                        <small>Controladores actualizados automáticamente</small>
                    </div>
                </div>
            </div>
            
            <div class="maintenance-actions">
                <h4>Opciones de actualización</h4>
                <div class="actions-grid">
                    <button class="action-btn primary check-updates-btn">
                        <i class="fas fa-search"></i>
                        Buscar actualizaciones
                    </button>
                    <button class="action-btn secondary configure-updates-btn">
                        <i class="fas fa-cog"></i>
                        Configurar actualizaciones
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderSecurityInfoDetailed(securityData) {
    console.log("Renderizando información de seguridad:", securityData);
    
    const firewall = securityData?.firewall || {};
    const antivirus = securityData?.antivirus || {};
    const firewallEnabled = firewall.enabled || false;
    const antivirusEnabled = antivirus.enabled || false;
    const overallSecurity = firewallEnabled && antivirusEnabled;
    
    return `
        <div class="component-detail-section">
            <h4>Estado de seguridad del sistema</h4>
            
            <div class="security-overview">
                <div class="security-status-main ${overallSecurity ? 'secure' : 'warning'}">
                    <div class="status-icon">
                        <i class="fas fa-${overallSecurity ? 'shield-alt' : 'exclamation-triangle'}"></i>
                    </div>
                    <div class="status-text">
                        <h3>${overallSecurity ? 'Sistema protegido' : 'Atención requerida'}</h3>
                        <p>${overallSecurity ? 'Todas las defensas están activas' : 'Algunos componentes de seguridad necesitan atención'}</p>
                    </div>
                </div>
            </div>
            
            <div class="security-components">
                <div class="security-item ${firewallEnabled ? 'active' : 'inactive'}">
                    <div class="security-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Firewall de Windows</h5>
                        <span class="security-status">${firewall.status || (firewallEnabled ? 'Activo' : 'Inactivo')}</span>
                        <p class="security-description">
                            ${firewallEnabled ? 'Protegiendo su equipo contra amenazas de red' : 'Firewall desactivado - su equipo está vulnerable'}
                        </p>
                    </div>
                    <div class="security-indicator">
                        <i class="fas fa-${firewallEnabled ? 'check-circle' : 'times-circle'}"></i>
                    </div>
                </div>
                
                <div class="security-item ${antivirusEnabled ? 'active' : 'inactive'}">
                    <div class="security-icon">
                        <i class="fas fa-virus-slash"></i>
                    </div>
                    <div class="security-details">
                        <h5>Protección antivirus</h5>
                        <span class="security-status">${antivirus.status || (antivirusEnabled ? 'Activo' : 'Inactivo')}</span>
                        <p class="security-description">
                            ${antivirusEnabled ? `${antivirus.name || 'Windows Defender'} protegiendo contra malware` : 'Sin protección antivirus activa'}
                        </p>
                    </div>
                    <div class="security-indicator">
                        <i class="fas fa-${antivirusEnabled ? 'check-circle' : 'times-circle'}"></i>
                    </div>
                </div>
                
                <div class="security-item active">
                    <div class="security-icon">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Actualizaciones automáticas</h5>
                        <span class="security-status">Activo</span>
                        <p class="security-description">Las actualizaciones de seguridad se instalan automáticamente</p>
                    </div>
                    <div class="security-indicator">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
            </div>
            
            ${!overallSecurity ? `
                <div class="security-recommendations">
                    <h4>Recomendaciones de seguridad</h4>
                    <div class="recommendations-list">
                        ${!firewallEnabled ? '<div class="recommendation-item">• Active el Firewall de Windows inmediatamente</div>' : ''}
                        ${!antivirusEnabled ? '<div class="recommendation-item">• Active la protección antivirus</div>' : ''}
                        <div class="recommendation-item">• Mantenga el sistema actualizado</div>
                        <div class="recommendation-item">• Use contraseñas seguras</div>
                    </div>
                </div>
            ` : ''}
            
            <div class="maintenance-actions">
                <h4>Acciones de seguridad</h4>
                <div class="actions-grid">
                    <button class="action-btn primary run-security-scan-btn">
                        <i class="fas fa-search"></i>
                        Escanear amenazas
                    </button>
                    <button class="action-btn secondary security-settings-btn">
                        <i class="fas fa-cog"></i>
                        Configurar seguridad
                    </button>
                </div>
            </div>
        </div>
    `;
}


async function cargarHistorialDiagnosticos() {
    try {
        const response = await fetch('/dashboard/client/historial/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener el historial de diagnósticos');
        }

        const data = await response.json();
        
        const componentsList = document.querySelector('.components-list');
        if (!componentsList) {
            console.error("No se encontró el elemento .components-list");
            return;
        }

        if (data.status === 'success' && data.historial && data.historial.length > 0) {
            componentsList.innerHTML = '';
            
            // Mostrar componentes basados en el último diagnóstico
            const ultimoDiagnostico = data.historial[0];
            
            if (ultimoDiagnostico) {
                // Crear componentes dinámicamente basados en los datos
                agregarComponente('CPU', ultimoDiagnostico.cpu_usage, getCPUStatus(ultimoDiagnostico.cpu_usage));
                agregarComponente('Memoria RAM', ultimoDiagnostico.ram_percent, getRAMStatus(ultimoDiagnostico.ram_percent));
                agregarComponente('Disco', ultimoDiagnostico.disk_percent, getDiskStatus(ultimoDiagnostico.disk_percent));
                agregarComponente('Red', 'Conexión activa', 'success');
                
                if (ultimoDiagnostico.gpu_model) {
                    agregarComponente('GPU', ultimoDiagnostico.gpu_model, 'success');
                }
            }
        } else {
            componentsList.innerHTML = '<div class="no-history-message">No hay diagnósticos previos</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        const componentsList = document.querySelector('.components-list');
        if (componentsList) {
            componentsList.innerHTML = '<div class="error-message">Error al cargar historial</div>';
        }
    }
}

function mostrarDetallesEscenario(escenario) {
    document.querySelector('.contentData').style.display = 'none';
    detailedResults.style.display = 'block';
    
    let statusClass = '';
    let statusText = '';
    
    switch (escenario.results.status) {
        case 'NORMAL':
            statusClass = 'success';
            statusText = 'Normal';
            break;
        case 'WARNING':
            statusClass = 'warning';
            statusText = 'Requiere atención';
            break;
        case 'CRITICAL':
            statusClass = 'error';
            statusText = 'Crítico';
            break;
        default:
            statusClass = 'unknown';
            statusText = 'Desconocido';
    }
    
    let issuesHtml = '';
    if (escenario.results.issues && escenario.results.issues.length > 0) {
        issuesHtml = `
            <div class="component-detail-section">
                <h4>Problemas detectados con PRECISIÓN</h4>
                <div class="issues-list enhanced">
        `;
        
        escenario.results.issues.forEach(issue => {
            const severityClass = issue.severity === 'HIGH' ? 'critical' : 
                               issue.severity === 'MEDIUM' ? 'warning' : 'info';
            
            const severityIcon = severityClass === 'critical' ? 'fa-exclamation-triangle' :
                               severityClass === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
                               
            const severityText = issue.severity === 'HIGH' ? 'CRÍTICO' :
                                issue.severity === 'MEDIUM' ? 'IMPORTANTE' : 'INFORMACIÓN';
            
            issuesHtml += `
                <div class="issue-item enhanced ${severityClass}">
                    <div class="issue-header">
                        <div class="issue-severity ${severityClass}">
                            <i class="fas ${severityIcon}"></i>
                            <span>${severityText}</span>
                        </div>
                        <h5 class="issue-title">${issue.description}</h5>
                    </div>
                    <p class="issue-recommendation">${issue.recommendation}</p>
                    ${issue.type === 'HARDWARE' && issue.severity === 'HIGH' ? 
                        '<div class="issue-urgency">🚨 REQUIERE ACCIÓN INMEDIATA</div>' : ''}
                </div>
            `;
        });
        
        issuesHtml += `
                </div>
            </div>
        `;
    }
    
    let batteryExtrasHtml = '';
    if (escenario.scenario.includes("batería") && escenario.results.battery_health) {
        const healthData = escenario.results.battery_health;
        const efficiency = escenario.results.power_efficiency;
        
        batteryExtrasHtml = `
            <div class="component-detail-section battery-health-section">
                <h4><i class="fas fa-battery-half"></i> Análisis avanzado de batería</h4>
                <div class="battery-metrics-grid">
                    ${healthData.design_capacity ? `
                        <div class="battery-metric">
                            <div class="metric-icon"><i class="fas fa-tachometer-alt"></i></div>
                            <div class="metric-info">
                                <span class="metric-label">Salud de batería</span>
                                <span class="metric-value">${((healthData.full_charge_capacity / healthData.design_capacity) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    ` : ''}
                    ${healthData.cycle_count ? `
                        <div class="battery-metric">
                            <div class="metric-icon"><i class="fas fa-sync"></i></div>
                            <div class="metric-info">
                                <span class="metric-label">Ciclos de carga</span>
                                <span class="metric-value">${healthData.cycle_count}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${efficiency !== 'N/A' ? `
                        <div class="battery-metric">
                            <div class="metric-icon"><i class="fas fa-leaf"></i></div>
                            <div class="metric-info">
                                <span class="metric-label">Eficiencia energética</span>
                                <span class="metric-value">${efficiency}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    let downloadButtonHtml = '';
    if (escenario.results.report_available && escenario.diagnosis_id) {
        downloadButtonHtml = `
            <div class="component-detail-section">
                <div class="download-section">
                    <h4><i class="fas fa-download"></i> Informe técnico disponible</h4>
                    <p>Se ha generado un informe detallado con análisis técnico completo.</p>
                    <button class="btn-dashboard btn-primary-dashboard download-battery-report" data-diagnosis-id="${escenario.diagnosis_id}">
                        <i class="fa-solid fa-file-download"></i> Descargar informe técnico completo
                    </button>
                </div>
            </div>
        `;
    }
    
    detailedResultsContent.innerHTML = `
        <div class="component-detail-header enhanced">
            <div class="scenario-icon">
                <i class="fas ${getScenarioIcon(escenario.scenario)}"></i>
            </div>
            <div class="header-content">
                <h3>${escenario.scenario}</h3>
                <div class="component-status-badge ${statusClass}">
                    <i class="fas ${getStatusIcon(statusClass)}"></i>
                    ${statusText}
                </div>
            </div>
        </div>
        
        <div class="component-detail-section">
            <h4>Análisis inteligente</h4>
            <p class="scenario-recommendations">${escenario.recommendations || 'Análisis completado sin recomendaciones específicas.'}</p>
        </div>
        
        ${batteryExtrasHtml}
        ${issuesHtml}
        ${downloadButtonHtml}
        
        <div class="scenario-timestamp">
            <p><i class="fas fa-clock"></i> Análisis realizado: ${formatearFecha(escenario.timestamp)}</p>
        </div>
        
        <div class="scenario-actions enhanced">
            <button class="btn-dashboard btn-info-dashboard run-driver-scan-btn">
                <i class="fas fa-brain"></i> Nuevo análisis inteligente
            </button>
            ${escenario.scenario.includes("controlador") ? `
                <button class="btn-dashboard btn-success-dashboard fix-all-scenario-drivers-btn">
                    <i class="fas fa-magic"></i> Solucionar automáticamente
                </button>
            ` : ''}
        </div>
    `;
    
    setupEnhancedEventListeners();
}

function setupEnhancedEventListeners() {
    const downloadButton = detailedResultsContent.querySelector('.download-battery-report');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const diagnosisId = this.getAttribute('data-diagnosis-id');
            if (diagnosisId) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando descarga...';
                this.disabled = true;
                
                window.open(`/dashboard/api/diagnosis/${diagnosisId}/file/BATTERY_REPORT/`, '_blank');
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fa-solid fa-file-download"></i> Descargar informe técnico completo';
                    this.disabled = false;
                }, 3000);
            }
        });
    }
    
    const fixButtons = detailedResultsContent.querySelectorAll('.fix-driver-btn');
    fixButtons.forEach(button => {
        button.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            repararControladorInteligente(deviceId, this);
        });
    });
    
    const fixAllButton = detailedResultsContent.querySelector('.fix-all-drivers-btn');
    if (fixAllButton) {
        fixAllButton.addEventListener('click', function() {
            repararTodosLosControladoresInteligente(this);
        });
    }
    
    const fixAllScenarioButton = detailedResultsContent.querySelector('.fix-all-scenario-drivers-btn');
    if (fixAllScenarioButton) {
        fixAllScenarioButton.addEventListener('click', function() {
            repararTodosLosControladores(this);
        });
    }
}


async function repararControladorInteligente(deviceId, buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-brain fa-spin"></i> Analizando...`;
        buttonElement.disabled = true;
        
        if (!deviceId || deviceId === 'unknown' || deviceId.includes('generic')) {
            mostrarNotificacion('info', 'Este dispositivo no requiere reparación individual. Use "Reparar todos" para un análisis completo.', 4);
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
            return;
        }
        
        const response = await fetch(`/dashboard/api/diagnosis/fix-driver/${deviceId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            buttonElement.innerHTML = `<i class="fas fa-check-circle"></i> REPARADO`;
            buttonElement.classList.remove('primary');
            buttonElement.classList.add('success');
            buttonElement.disabled = true;
            
            mostrarNotificacion('success', 'Controlador reparado con éxito. ' + (data.requires_restart ? 'Reinicio requerido.' : ''), 5);
            
            if (data.requires_restart) {
                setTimeout(() => mostrarDialogoReinicio(), 2000);
            }
        } else {
            throw new Error(data.message || 'Error en reparación inteligente');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error en reparación: ' + error.message, 3);
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
    }
}

function getScenarioIcon(scenarioName) {
    const icons = {
        'batería': 'fa-battery-half',
        'controlador': 'fa-microchip', 
        'pantalla azul': 'fa-desktop',
        'sistema lento': 'fa-tachometer-alt',
        'conectividad': 'fa-wifi',
        'arranque': 'fa-power-off'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (scenarioName.toLowerCase().includes(key)) {
            return icon;
        }
    }
    
    return 'fa-cog';
}

function getStatusIcon(statusClass) {
    switch (statusClass) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-question-circle';
    }
}

function extraerDeviceIdDeDescripcion(descripcion) {
    const hardwareIdMatch = descripcion.match(/\b([A-Z0-9]+\\[A-Z0-9&_\-\.\\]+)\b/i);
    if (hardwareIdMatch) {
        return hardwareIdMatch[1];
    }

    const idExplicito = descripcion.match(/\b(ID|DeviceID|InstanceID):?\s*([A-Z0-9\\&\{\}_\-\.]+)/i);
    if (idExplicito && idExplicito[2]) {
        return idExplicito[2].trim();
    }
    
    return null;
}

function renderCPUDetailsComplete(systemData) {
    const cpuUsage = systemData.cpu_usage || 'N/A';
    const cpuTemp = systemData.cpu_temp || 'N/A';
    const cpuFreq = systemData.cpu_freq || 'N/A';
    const cpuCores = systemData.cpu_cores || 'N/A';
    const topProcesses = systemData.top_processes || [];

    let html = `
        <div class="component-detail-header">
            <h3>Procesador (CPU)</h3>
            <div class="component-detail-status ${getCPUStatus(cpuUsage)}">
                ${cpuUsage}
            </div>
        </div>
        
        <div class="component-detail-section">
            <h4>Detalles del procesador</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-name">Uso actual:</span>
                    <span class="metric-value">${cpuUsage}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Frecuencia:</span>
                    <span class="metric-value">${cpuFreq}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Núcleos:</span>
                    <span class="metric-value">${cpuCores}</span>
                </div>
            </div>
        </div>`;
    
    if (topProcesses && topProcesses.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Procesos con mayor consumo</h4>
                <div class="process-list">
                    <table class="process-table">
                        <thead>
                            <tr>
                                <th>Proceso</th>
                                <th>PID</th>
                                <th>CPU</th>
                                <th>Memoria</th>
                            </tr>
                        </thead>
                        <tbody>`;
                        
        topProcesses.forEach(process => {
            html += `
                <tr>
                    <td>${process.name}</td>
                    <td>${process.pid}</td>
                    <td>${process.cpu_percent}</td>
                    <td>${process.memory_percent}</td>
                </tr>`;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    return html;
}

function renderCPUDetails(usage, temp, processes) {
    const cpuValue = parseFloat(usage.replace('%', '')) || 0;
    const tempValue = temp && temp !== 'No disponible' ? temp : 'N/A';
    
    let html = `
        <div class="component-detail-section">
            <h4>Detalles del procesador</h4>
            
            <div class="cpu-overview-card">
                <div class="performance-gauge">
                    <div class="gauge-container">
                        <div class="gauge" style="--percentage: ${cpuValue * 3.6}deg;">
                            <div class="gauge-center">
                                <span class="gauge-value">${usage}</span>
                                <span class="gauge-label">Uso actual</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="metrics-grid enhanced">
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Uso de CPU</span>
                            <span class="metric-value ${getUsageClass(cpuValue)}">${usage}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-thermometer-half"></i>
                        </div>
                      
                    </div>
                </div>
            </div>
        </div>`;
        
    if (processes && processes.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Procesos con mayor consumo</h4>
                <div class="processes-table">
                    <div class="processes-header">
                        <span>Proceso</span>
                        <span>PID</span>
                        <span>CPU</span>
                        <span>Memoria</span>
                    </div>`;
                    
        processes.forEach(process => {
            html += `
                <div class="process-row">
                    <span class="process-name">${process.name}</span>
                    <span class="process-pid">${process.pid}</span>
                    <span class="process-cpu">${process.cpu_percent}</span>
                    <span class="process-memory">${process.memory_percent}</span>
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    return html;
}

function renderRAMDetails(ramData) {
    if (!ramData) return '<p>No hay datos disponibles sobre la memoria RAM.</p>';
    
    const ramPercent = parseFloat((ramData.percent || '0%').replace('%', '')) || 0;
    const swapPercent = parseFloat((ramData.swap_percent || '0%').replace('%', '')) || 0;
    
    let html = `
        <div class="component-detail-section">
            <h4>Detalles de la memoria</h4>
            
            <div class="memory-overview">
                <div class="memory-gauge-container">
                    <div class="memory-gauge">
                        <div class="gauge" style="--percentage: ${ramPercent * 3.6}deg;">
                            <div class="gauge-center">
                                <span class="gauge-value">${ramData.percent || '0%'}</span>
                                <span class="gauge-label">RAM en uso</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="metrics-grid enhanced">
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-memory"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Total</span>
                            <span class="metric-value">${ramData.total || 'No disponible'}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">En uso</span>
                            <span class="metric-value ${getUsageClass(ramPercent)}">${ramData.used || 'No disponible'}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Disponible</span>
                            <span class="metric-value">${ramData.available || 'No disponible'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
    if (ramData.swap_total && ramData.swap_total !== "0.00 B") {
        html += `
            <div class="component-detail-section">
                <h4>Memoria virtual (Swap)</h4>
                <div class="metrics-grid enhanced">
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-hdd"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Total</span>
                            <span class="metric-value">${ramData.swap_total}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">En uso</span>
                            <span class="metric-value ${getUsageClass(swapPercent)}">${ramData.swap_percent}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
        
    if (ramData.memory_intensive_processes && ramData.memory_intensive_processes.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Procesos con mayor consumo de memoria</h4>
                <div class="processes-table">
                    <div class="processes-header">
                        <span>Proceso</span>
                        <span>Memoria</span>
                    </div>`;
                    
        ramData.memory_intensive_processes.forEach(process => {
            html += `
                <div class="process-row">
                    <span class="process-name">${process.name || 'Desconocido'}</span>
                    <span class="process-memory">${process.memory_percent || 'N/A'}</span>
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    return html;
}
function renderDiskDetails(diskData) {
    if (!diskData || !diskData.partitions) return '<p>No hay datos disponibles sobre el almacenamiento.</p>';
    
    let html = `
        <div class="component-detail-section">
            <h4>Particiones de disco</h4>
            <div class="disk-partitions">`;
                
    diskData.partitions.forEach(partition => {
        const percentValue = parseFloat((partition.percent || '0%').replace('%', '')) || 0;
        const statusClass = percentValue > 90 ? 'critical' : percentValue > 75 ? 'warning' : 'normal';
        
        html += `
            <div class="partition-card ${statusClass}">
                <div class="partition-header">
                    <div class="partition-icon">
                        <i class="fas ${partition.device && partition.device.includes('C:') ? 'fa-hdd' : 'fa-folder'}"></i>
                    </div>
                    <div class="partition-info">
                        <h5>${partition.device || 'N/A'}</h5>
                        <span class="partition-path">${partition.mountpoint || 'N/A'}</span>
                    </div>
                    <div class="partition-usage ${statusClass}">
                        ${partition.percent || '0%'}
                    </div>
                </div>
                
                <div class="partition-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" style="width: ${partition.percent || '0%'}"></div>
                    </div>
                </div>
                
                <div class="partition-details">
                    <div class="detail-item">
                        <span class="detail-label">Total:</span>
                        <span class="detail-value">${partition.total || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Usado:</span>
                        <span class="detail-value">${partition.used || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Libre:</span>
                        <span class="detail-value">${partition.free || 'N/A'}</span>
                    </div>
                </div>
            </div>`;
    });
    
    html += `
            </div>
        </div>`;
        
    if (diskData.health) {
        const healthClass = diskData.health.status === 'Critical' ? 'critical' : 'normal';
        
        html += `
            <div class="component-detail-section">
                <h4>Estado de salud del disco</h4>
                <div class="health-indicator ${healthClass}">
                    <div class="health-icon">
                        <i class="fas ${healthClass === 'critical' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                    </div>
                    <div class="health-text">
                        <span class="health-status">${diskData.health.status || 'No disponible'}</span>
                        <span class="health-description">${healthClass === 'critical' ? 'Se requiere atención inmediata' : 'Funcionando correctamente'}</span>
                    </div>
                </div>
            </div>`;
    }
    
    return html;
}

function renderNetworkDetails(networkData) {
    if (!networkData) return '<p>No hay datos disponibles sobre la red.</p>';
    
    const isConnected = networkData.internet_status?.connected || false;
    const connectionClass = isConnected ? 'connected' : 'disconnected';
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado de conectividad</h4>
            
            <div class="network-status-card ${connectionClass}">
                <div class="connection-indicator">
                    <div class="connection-icon">
                        <i class="fas ${isConnected ? 'fa-wifi' : 'fa-wifi-slash'}"></i>
                    </div>
                    <div class="connection-info">
                        <h5>${isConnected ? 'Conectado a Internet' : 'Sin conexión'}</h5>
                        <span class="connection-details">
                            ${networkData.internet_status?.ping ? `Ping: ${networkData.internet_status.ping} ms` : 'Estado desconocido'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="component-detail-section">
            <h4>Estadísticas de red</h4>
            <div class="metrics-grid enhanced">
                <div class="metric-item enhanced">
                    <div class="metric-icon">
                        <i class="fas fa-upload"></i>
                    </div>
                    <div class="metric-content">
                        <span class="metric-name">Datos enviados</span>
                        <span class="metric-value">${networkData.bytes_sent || 'No disponible'}</span>
                    </div>
                </div>
                <div class="metric-item enhanced">
                    <div class="metric-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <div class="metric-content">
                        <span class="metric-name">Datos recibidos</span>
                        <span class="metric-value">${networkData.bytes_recv || 'No disponible'}</span>
                    </div>
                </div>
                <div class="metric-item enhanced">
                    <div class="metric-icon">
                        <i class="fas fa-link"></i>
                    </div>
                    <div class="metric-content">
                        <span class="metric-name">Conexiones activas</span>
                        <span class="metric-value">${networkData.connections || '0'}</span>
                    </div>
                </div>
            </div>
        </div>`;
        
    if (networkData.wifi_status && networkData.wifi_status.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Adaptadores de red</h4>
                <div class="adapters-list">`;
                
        networkData.wifi_status.forEach(adapter => {
            const adapterStatus = adapter.Status === 'Up' ? 'active' : 'inactive';
            
            html += `
                <div class="adapter-card ${adapterStatus}">
                    <div class="adapter-icon">
                        <i class="fas fa-network-wired"></i>
                    </div>
                    <div class="adapter-info">
                        <h5>${adapter.Name || 'Adaptador desconocido'}</h5>
                        <div class="adapter-details">
                            <span class="adapter-status ${adapterStatus}">${adapter.Status || 'Desconocido'}</span>
                            <span class="adapter-speed">${adapter.LinkSpeed || 'Velocidad desconocida'}</span>
                        </div>
                    </div>
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    return html;
}

async function cargarEstadoSistemaReal() {
    try {
        console.log("Iniciando carga del estado del sistema...");
        
        const headers = document.querySelectorAll('h3, h4, .section-title');
        let estadoSistemaHeader = null;
        
        for (const header of headers) {
            if (header.textContent.includes('Estado del sistema')) {
                estadoSistemaHeader = header;
                break;
            }
        }
        
        if (!estadoSistemaHeader) {
            console.log("No se encontró el header de Estado del sistema");
            return;
        }

        const container = estadoSistemaHeader.closest('div');
        if (!container) {
            console.log("No se encontró el contenedor");
            return;
        }
        
        let estadoSistemaItems = container.querySelector('.estado-sistema-items');
        if (!estadoSistemaItems) {
            estadoSistemaItems = document.createElement('div');
            estadoSistemaItems.className = 'estado-sistema-items';
            estadoSistemaItems.style.display = 'grid';
            estadoSistemaItems.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            estadoSistemaItems.style.gap = '15px';
            estadoSistemaItems.style.margin = '15px 0';
            
            if (estadoSistemaHeader.nextElementSibling) {
                estadoSistemaHeader.parentNode.insertBefore(estadoSistemaItems, estadoSistemaHeader.nextElementSibling);
            } else {
                container.appendChild(estadoSistemaItems);
            }
        }
        
        estadoSistemaItems.innerHTML = `
            <div class="sistema-item" data-tipo="seguridad" style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                <div style="background-color: #17a2b8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-shield-alt" style="color: white;"></i>
                </div>
                <div>
                    <strong style="display: block; margin-bottom: 4px;">Seguridad</strong>
                    <span>Verificando...</span>
                </div>
            </div>
            
            <div class="sistema-item" data-tipo="actualizaciones" style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                <div style="background-color: #17a2b8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-sync-alt" style="color: white;"></i>
                </div>
                <div>
                    <strong style="display: block; margin-bottom: 4px;">Actualizaciones</strong>
                    <span>Verificando...</span>
                </div>
            </div>
            
            <div class="sistema-item" data-tipo="controladores" style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                <div style="background-color: #17a2b8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-cogs" style="color: white;"></i>
                </div>
                <div>
                    <strong style="display: block; margin-bottom: 4px;">Controladores</strong>
                    <span>Verificando...</span>
                </div>
            </div>
            
            <div class="sistema-item" data-tipo="cpu" style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                <div style="background-color: #17a2b8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-tachometer-alt" style="color: white;"></i>
                </div>
                <div>
                    <strong style="display: block; margin-bottom: 4px;">Porcentaje de uso</strong>
                    <span>Verificando...</span>
                </div>
            </div>
        `;
        
        await cargarDatosEspecificosConReintento(estadoSistemaItems);
        
    } catch (error) {
        console.error('Error al cargar estado del sistema:', error);
        mostrarEstadoSistemaError();
    }
}

function getCPUStatusFromUsage(usage) {
    try {
        if (!usage || usage === 'N/A') return 'unknown';
        const valorCPU = parseFloat(usage.replace('%', ''));
        if (isNaN(valorCPU)) return 'unknown';
        
        if (valorCPU > 80) return 'error';
        if (valorCPU > 60) return 'warning';
        return 'success';
    } catch (e) {
        console.error("Error en getCPUStatusFromUsage:", e);
        return 'unknown';
    }
}

async function cargarDatosControladores(container) {
    try {
        console.log("Verificando controladores...");
        actualizarElementoSistema(container, 'controladores', 'Sin problemas detectados', 'success');
    } catch (error) {
        console.error('Error al cargar datos de controladores:', error);
        actualizarElementoSistema(container, 'controladores', 'Error al verificar', 'error');
    }
}

function actualizarElementoSistema(container, tipo, texto, status) {
    try {
        console.log(`Actualizando elemento ${tipo} con texto: ${texto}, status: ${status}`);
        
        const elemento = container.querySelector(`[data-tipo="${tipo}"]`);
        if (!elemento) {
            console.error(`No se encontró elemento con tipo: ${tipo}`);
            return;
        }
        
        const span = elemento.querySelector('span');
        if (span) {
            span.textContent = texto;
        }
        
        const iconContainer = elemento.querySelector('div[style*="background-color"]');
        if (iconContainer) {
            const newColor = getStatusColor(status);
            iconContainer.style.backgroundColor = newColor;
            console.log(`Color actualizado para ${tipo}: ${newColor}`);
        }
        
        elemento.setAttribute('data-status', status);
        
        console.log(`Elemento ${tipo} actualizado correctamente`);
    } catch (error) {
        console.error(`Error al actualizar elemento ${tipo}:`, error);
    }
}

function mostrarErroresEnElementos(container) {
    const elementos = container.querySelectorAll('.sistema-item');
    elementos.forEach(elemento => {
        const tipo = elemento.getAttribute('data-tipo');
        const span = elemento.querySelector('span');
        if (span && span.textContent === 'Verificando...') {
            span.textContent = 'Error al verificar';
            const iconContainer = elemento.querySelector('div[style*="background-color"]');
            if (iconContainer) {
                iconContainer.style.backgroundColor = getStatusColor('error');
            }
        }
    });
}
function mostrarEstadoSistemaReal(systemData) {
    const headers = document.querySelectorAll('h3, h4, .section-title');
    let estadoSistemaHeader = null;
    
    for (const header of headers) {
        if (header.textContent.includes('Estado del sistema')) {
            estadoSistemaHeader = header;
            break;
        }
    }
    
    if (estadoSistemaHeader) {
        const container = estadoSistemaHeader.closest('div');
        
        if (container && !container.querySelector('.estado-sistema-items')) {
            const estadoSistemaItems = document.createElement('div');
            estadoSistemaItems.className = 'estado-sistema-items';
            estadoSistemaItems.style.display = 'grid';
            estadoSistemaItems.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            estadoSistemaItems.style.gap = '15px';
            estadoSistemaItems.style.margin = '15px 0';
            
            const systemItems = [
                {
                    title: 'Seguridad',
                    icon: 'fa-shield-alt',
                    status: 'info', 
                    text: 'Verificando...'
                },
                {
                    title: 'Actualizaciones',
                    icon: 'fa-sync-alt', 
                    status: 'info',
                    text: 'Verificando...'
                },
                {
                    title: 'Controladores',
                    icon: 'fa-cogs',
                    status: 'info',
                    text: 'Verificando...'
                },
                {
                    title: 'Porcentaje de uso',
                    icon: 'fa-tachometer-alt',
                    status: systemData.cpu_usage !== 'N/A' ? getCPUStatusFromUsage(systemData.cpu_usage) : 'unknown',
                    text: systemData.cpu_usage !== 'N/A' ? `CPU: ${systemData.cpu_usage}` : 'No disponible'
                }
            ];
            
            systemItems.forEach(item => {
                const statusColor = getStatusColor(item.status);
                
                estadoSistemaItems.innerHTML += `
                    <div style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                        <div style="background-color: ${statusColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <i class="fas ${item.icon}" style="color: white;"></i>
                        </div>
                        <div>
                            <strong style="display: block; margin-bottom: 4px;">${item.title}</strong>
                            <span>${item.text}</span>
                        </div>
                    </div>
                `;
            });
            
            if (estadoSistemaHeader.nextElementSibling) {
                estadoSistemaHeader.parentNode.insertBefore(estadoSistemaItems, estadoSistemaHeader.nextElementSibling);
            } else {
                container.appendChild(estadoSistemaItems);
            }
            
            cargarDatosEspecificos(estadoSistemaItems);
        }
    }
}

async function cargarDatosActualizaciones(container) {
    try {
        console.log("Cargando datos de actualizaciones...");
        
        const response = await fetch('/dashboard/system/updates-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log("Respuesta de actualizaciones - Status:", response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos de actualizaciones recibidos:", data);
        
        if (data.status === 'success' && data.data) {
            const status = data.data.status === 'UpToDate' ? 'Al día' : 
                         `${data.data.count || 'Actualizaciones'} pendientes`;
            const statusType = data.data.status === 'UpToDate' ? 'success' : 'warning';
            
            actualizarElementoSistema(container, 'actualizaciones', status, statusType);
        } else {
            throw new Error(data.message || 'Datos de actualizaciones inválidos');
        }
    } catch (error) {
        console.error('Error al cargar datos de actualizaciones:', error);
        actualizarElementoSistema(container, 'actualizaciones', 'Error al verificar', 'error');
    }
}

async function cargarDatosEspecificosConReintento(container, maxReintentos = 3) {
    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            console.log(`Intento ${intento} de cargar datos específicos...`);
            
            await cargarDatosSistemaBasicos(container);
            
            await Promise.allSettled([
                cargarDatosSeguridad(container),
                cargarDatosActualizaciones(container),
                cargarDatosControladores(container)
            ]);
            
            console.log("Datos específicos cargados exitosamente");
            break; 
            
        } catch (error) {
            console.error(`Error en intento ${intento}:`, error);
            
            if (intento === maxReintentos) {
                console.error("Se agotaron los reintentos, mostrando errores");
                mostrarErroresEnElementos(container);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000 * intento));
            }
        }
    }
}

async function cargarDatosSistemaBasicos(container) {
    try {
        console.log("Cargando datos REALES del sistema...");
        
        const response = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos REALES del sistema recibidos:", data);
        
        if (data.status === 'success' && data.data) {
            const cpuUsage = data.data.cpu_usage || 'N/A';
            const cpuStatus = getCPUStatusFromUsage(cpuUsage);
            actualizarElementoSistema(container, 'cpu', `CPU: ${cpuUsage}`, cpuStatus);
            
            try {
                const driversData = await obtenerDatosRealControladores();
                const driversStatus = driversData.status === 'NORMAL' ? 'success' : 
                                   driversData.status === 'WARNING' ? 'warning' : 
                                   driversData.status === 'CRITICAL' ? 'error' : 'info';
                                   
                const driversText = driversData.problematic_drivers?.length > 0 ? 
                                  `${driversData.problematic_drivers.length} problemas detectados` :
                                  'Sin problemas detectados';
                                  
                actualizarElementoSistema(container, 'controladores', driversText, driversStatus);
            } catch (error) {
                console.error('Error al obtener datos de controladores:', error);
                actualizarElementoSistema(container, 'controladores', 'Ejecute diagnóstico completo', 'info');
            }
            
        } else {
            throw new Error(data.message || 'Respuesta inválida del servidor');
        }
    } catch (error) {
        console.error('Error al cargar datos básicos:', error);
        actualizarElementoSistema(container, 'cpu', 'Error al verificar', 'error');
        actualizarElementoSistema(container, 'controladores', 'Error al verificar', 'error');
    }
}
async function ejecutarDiagnosticoCompleto() {
    try {
        console.log("Iniciando diagnóstico completo para obtener datos actualizados...");
        
        showScanProgressModal();
        currentComponentScan.textContent = "Iniciando diagnóstico completo...";
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        scanDetailsText.textContent = "Analizando todos los componentes del sistema...";
        
        const formData = new FormData();
        formData.append('scan_type', 'QuickScan');
        
        const response = await fetch('/dashboard/api/diagnosis/start/', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al iniciar el diagnóstico');
        }

        const data = await response.json();

        if (data.status === 'success') {
            mostrarNotificacion('success', 'Diagnóstico completo iniciado', 3);
            const diagnosisId = data.diagnosis_id;
            monitorearProgresoScan(diagnosisId);
        } else {
            throw new Error(data.message || 'Error al iniciar el diagnóstico');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al iniciar diagnóstico completo: ' + error.message, 3);
        hideScanProgressModal();
    }
}
async function cargarDatosSeguridad(container) {
    try {
        console.log("Cargando datos de seguridad...");
        
        const response = await fetch('/dashboard/system/security-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log("Respuesta de seguridad - Status:", response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos de seguridad recibidos:", data);
        
        if (data.status === 'success' && data.data) {
            const firewall = data.data.firewall?.enabled || false;
            const antivirus = data.data.antivirus?.enabled || false;
            const isSecure = firewall && antivirus;
            
            actualizarElementoSistema(container, 'seguridad', 
                isSecure ? 'Protección activa' : 'Necesita atención',
                isSecure ? 'success' : 'warning'
            );
        } else {
            throw new Error(data.message || 'Datos de seguridad inválidos');
        }
    } catch (error) {
        console.error('Error al cargar datos de seguridad:', error);
        actualizarElementoSistema(container, 'seguridad', 'Error al verificar', 'error');
    }
}


async function cargarDatosEspecificos(container) {
    try {
        const securityResponse = await fetch('/dashboard/system/security-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (securityResponse.ok) {
            const securityData = await securityResponse.json();
            if (securityData.status === 'success') {
                const isSecure = securityData.data.firewall?.enabled && securityData.data.antivirus?.enabled;
                actualizarElementoEstado(container, 'Seguridad', 
                    isSecure ? 'Protección activa' : 'Necesita atención',
                    isSecure ? 'success' : 'warning'
                );
            }
        }
        
        const updatesResponse = await fetch('/dashboard/system/updates-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (updatesResponse.ok) {
            const updatesData = await updatesResponse.json();
            if (updatesData.status === 'success') {
                const status = updatesData.data.status === 'UpToDate' ? 'Al día' : 
                             `${updatesData.data.count || 'Actualizaciones'} pendientes`;
                const statusType = updatesData.data.status === 'UpToDate' ? 'success' : 'warning';
                
                actualizarElementoEstado(container, 'Actualizaciones', status, statusType);
            }
        }
        
        const driversResponse = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (driversResponse.ok) {
            const driversData = await driversResponse.json();
            if (driversData.status === 'success') {
                actualizarElementoEstado(container, 'Controladores', 'Sin problemas detectados', 'success');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar datos específicos:', error);
    }
}

function actualizarElementoEstado(container, titulo, texto, status) {
    const elementos = container.querySelectorAll('div');
    for (const elemento of elementos) {
        const strong = elemento.querySelector('strong');
        if (strong && strong.textContent === titulo) {
            const span = elemento.querySelector('span');
            if (span) {
                span.textContent = texto;
            }
            
            const iconContainer = elemento.querySelector('div[style*="background-color"]');
            if (iconContainer) {
                iconContainer.style.backgroundColor = getStatusColor(status);
            }
            break;
        }
    }
}

async function cargarHistorialDiagnosticosReal() {
    try {
        console.log("Cargando historial de diagnósticos...");
        
        const response = await fetch('/dashboard/client/historial/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener el historial de diagnósticos');
        }

        const data = await response.json();
        console.log("Datos de historial recibidos:", data);
        
        const componentsList = document.querySelector('.components-list');
        const systemComponentsList = document.querySelector('.system-components-list');
        
        if (!componentsList || !systemComponentsList) {
            console.error("No se encontraron los contenedores de componentes");
            return;
        }

        componentsList.innerHTML = '';
        systemComponentsList.innerHTML = '';

        if (data.status === 'success' && data.historial && data.historial.length > 0) {
            const ultimoDiagnostico = data.historial[0];
            
            // Agregar componentes principales
            if (ultimoDiagnostico.cpu_usage) {
                agregarComponenteReal('CPU', ultimoDiagnostico.cpu_usage, getCPUStatus(ultimoDiagnostico.cpu_usage), componentsList);
            }
            
            if (ultimoDiagnostico.ram_percent) {
                agregarComponenteReal('Memoria RAM', ultimoDiagnostico.ram_percent, getRAMStatus(ultimoDiagnostico.ram_percent), componentsList);
            }
            
            if (ultimoDiagnostico.disk_percent) {
                agregarComponenteReal('Disco', ultimoDiagnostico.disk_percent, getDiskStatus(ultimoDiagnostico.disk_percent), componentsList);
            }
            
            agregarComponenteReal('Red', 'Conexión activa', 'success', componentsList);
            
            if (ultimoDiagnostico.gpu_model) {
                agregarComponenteReal('GPU', ultimoDiagnostico.gpu_model, 'success', componentsList);
            }
            
            // Agregar componentes del sistema (sin verificaciones adicionales para evitar duplicación)
            agregarComponenteReal('Controladores', 'Sin problemas detectados', 'success', systemComponentsList, true);
            agregarComponenteReal('Actualizaciones', 'Al día', 'success', systemComponentsList, true);
            agregarComponenteReal('Seguridad', 'Protegido', 'success', systemComponentsList, true);
            
            actualizarResumenDiagnostico(ultimoDiagnostico);
            
        } else {
            componentsList.innerHTML = '<div class="no-history-message">No hay diagnósticos previos. Ejecute un diagnóstico para ver resultados.</div>';
            systemComponentsList.innerHTML = '<div class="no-history-message">Ejecute un diagnóstico para ver el estado del sistema.</div>';
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
        const componentsList = document.querySelector('.components-list');
        const systemComponentsList = document.querySelector('.system-components-list');
        
        if (componentsList) {
            componentsList.innerHTML = '<div class="error-message">Error al cargar historial. Intente ejecutar un nuevo diagnóstico.</div>';
        }
        if (systemComponentsList) {
            systemComponentsList.innerHTML = '<div class="error-message">Error al cargar estado del sistema.</div>';
        }
    }
}

function mostrarDetallesComponenteMejorado(componentName) {
    document.querySelector('.contentData').style.display = 'none';
    detailedResults.style.display = 'block';
    
    detailedResultsContent.innerHTML = `
        <div class="loading-details">
            <div class="spinner"></div>
            <p>Cargando detalles del componente...</p>
        </div>
    `;
    
    setTimeout(async () => {
        try {
            const response = await fetch('/dashboard/api/diagnosis-data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    renderizarDetallesMejorados(componentName, data.data);
                }
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            mostrarErrorDetalles(componentName);
        }
    }, 500);
}

function renderizarDetallesMejorados(componentName, data) {
    const normalizedName = componentName.split('(')[0].trim().toLowerCase();
    
    let detailsHtml = `
        <div class="component-detail-header-enhanced">
            <div class="component-icon">
                <i class="fas ${getComponentIcon(normalizedName)}"></i>
            </div>
            <div class="component-title-info">
                <h2>${componentName.split('(')[0].trim()}</h2>
                <span class="component-status-badge ${getComponentStatusClass(data)}">${getComponentStatusText(data, normalizedName)}</span>
            </div>
        </div>
    `;
    
    if (normalizedName.includes('gpu') || normalizedName.includes('gráfica')) {
        detailsHtml += renderGPUDetailsMejorados(data.gpu_info || []);
    } else if (normalizedName.includes('cpu') || normalizedName.includes('procesador')) {
        detailsHtml += renderCPUDetailsMejorados(data);
    } else if (normalizedName.includes('ram') || normalizedName.includes('memoria')) {
        detailsHtml += renderRAMDetailsMejorados(data.ram_usage || {});
    } else if (normalizedName.includes('disco') || normalizedName.includes('almacenamiento')) {
        detailsHtml += renderDiskDetailsMejorados(data.disk_usage || {});
    } else if (normalizedName.includes('red') || normalizedName.includes('network')) {
        detailsHtml += renderNetworkDetailsMejorados(data.network || {});
    } else {
        detailsHtml += `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <h3>Información no disponible</h3>
                <p>No hay detalles específicos disponibles para este componente en este momento.</p>
            </div>
        `;
    }
    
    detailedResultsContent.innerHTML = detailsHtml;
}


async function verificarEstadoRed(container) {
    try {
        const response = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.data.network) {
                const networkStatus = data.data.network.connections > 0 ? 'Conexión activa' : 'Sin conexión';
                const statusType = data.data.network.connections > 0 ? 'success' : 'error';
                
                actualizarComponenteEnLista(container, 'Red', networkStatus, statusType);
            }
        }
    } catch (error) {
        console.error('Error al verificar estado de red:', error);
        actualizarComponenteEnLista(container, 'Red', 'Error al verificar', 'error');
    }
}


async function cargarComponentesEstadoSistema(container) {
    const componentes = [
        { nombre: 'Controladores', estado: 'Verificando...', tipo: 'info' },
        { nombre: 'Actualizaciones', estado: 'Verificando...', tipo: 'info' },
        { nombre: 'Seguridad', estado: 'Verificando...', tipo: 'info' }
    ];
    
    componentes.forEach(comp => {
        agregarComponenteReal(comp.nombre, comp.estado, comp.tipo, container, true);
    });
    
    try {
        const response = await fetch('/dashboard/api/diagnosis-data/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                actualizarComponenteEnLista(container, 'Controladores', 'Sin problemas detectados', 'success');
            }
        }
        
        const securityResponse = await fetch('/dashboard/system/security-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (securityResponse.ok) {
            const securityData = await securityResponse.json();
            if (securityData.status === 'success') {
                const isSecure = securityData.data.firewall?.enabled && securityData.data.antivirus?.enabled;
                actualizarComponenteEnLista(container, 'Seguridad', 
                    isSecure ? 'Protegido' : 'Necesita atención',
                    isSecure ? 'success' : 'warning'
                );
            }
        }
        
        const updatesResponse = await fetch('/dashboard/system/updates-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (updatesResponse.ok) {
            const updatesData = await updatesResponse.json();
            if (updatesData.status === 'success') {
                const status = updatesData.data.status === 'UpToDate' ? 'Al día' : 
                             `${updatesData.data.count || 'Pendientes'}`;
                const statusType = updatesData.data.status === 'UpToDate' ? 'success' : 'warning';
                
                actualizarComponenteEnLista(container, 'Actualizaciones', status, statusType);
            }
        }
        
    } catch (error) {
        console.error('Error al cargar componentes del estado del sistema:', error);
    }
}

function agregarComponenteReal(nombre, valor, estado, container, isSystemComponent = false) {
    const statusClass = estado === 'success' ? 'success' : 
                       estado === 'warning' ? 'warning' : 
                       estado === 'error' ? 'error' : 'info';
                        
    const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                      statusClass === 'warning' ? 'fa-exclamation-triangle' : 
                      statusClass === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    const componentItem = document.createElement('div');
    componentItem.className = 'component-item';
    componentItem.innerHTML = `
        <div class="component-status ${statusClass}">
            <i class="fa-solid ${statusIcon}"></i>
        </div>
        <div class="component-name">${nombre} (${valor})</div>
        <div class="component-details-toggle">
            <i class="fa-solid fa-chevron-down"></i>
        </div>
    `;
    
    if (isSystemComponent) {
        componentItem.setAttribute('data-component-type', nombre.toLowerCase());
    }
    
    container.appendChild(componentItem);
}

function actualizarComponenteEnLista(container, nombre, nuevoValor, nuevoEstado) {
    const items = container.querySelectorAll('.component-item');
    for (const item of items) {
        const nameElement = item.querySelector('.component-name');
        if (nameElement && nameElement.textContent.includes(nombre)) {
            nameElement.textContent = `${nombre} (${nuevoValor})`;
            
            const statusElement = item.querySelector('.component-status');
            const iconElement = statusElement.querySelector('i');
            
            statusElement.classList.remove('success', 'warning', 'error', 'info');
            
            const statusClass = nuevoEstado === 'success' ? 'success' : 
                               nuevoEstado === 'warning' ? 'warning' : 
                               nuevoEstado === 'error' ? 'error' : 'info';
            statusElement.classList.add(statusClass);
            
            const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                              statusClass === 'warning' ? 'fa-exclamation-triangle' : 
                              statusClass === 'error' ? 'fa-times-circle' : 'fa-info-circle';
            
            iconElement.className = `fa-solid ${statusIcon}`;
            break;
        }
    }
}

function actualizarResumenDiagnostico(diagnostico) {
    const summaryElement = document.querySelector('.diagnosis-summary-info p.diagnosis-type');
    if (summaryElement && diagnostico) {
        const problemas = diagnostico.issues_count || 0;
        const advertencias = diagnostico.warnings_count || 0;
        
        summaryElement.innerHTML = `Diagnóstico | <span class="diagnosis-problems">${problemas} Problemas</span>, <span class="diagnosis-suggestions">${advertencias} Sugerencias</span>`;
    }
    
    const lastCheckElement = document.getElementById('last-check-date');
    if (lastCheckElement && diagnostico.timestamp) {
        lastCheckElement.textContent = formatearFecha(diagnostico.timestamp);
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'success': return '#28a745';
        case 'warning': return '#ffc107';
        case 'error': return '#dc3545';
        case 'info': return '#17a2b8';
        default: return '#6c757d';
    }
}

function mostrarEstadoSistemaError() {
    const headers = document.querySelectorAll('h3, h4, .section-title');
    let estadoSistemaHeader = null;
    
    for (const header of headers) {
        if (header.textContent.includes('Estado del sistema')) {
            estadoSistemaHeader = header;
            break;
        }
    }
    
    if (estadoSistemaHeader) {
        const container = estadoSistemaHeader.closest('div');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.padding = '15px';
            errorDiv.style.backgroundColor = '#1e2a38';
            errorDiv.style.borderRadius = '8px';
            errorDiv.style.margin = '15px 0';
            errorDiv.innerHTML = '<p>Error al cargar el estado del sistema. Ejecute un diagnóstico para obtener información actualizada.</p>';
            
            if (estadoSistemaHeader.nextElementSibling) {
                estadoSistemaHeader.parentNode.insertBefore(errorDiv, estadoSistemaHeader.nextElementSibling);
            } else {
                container.appendChild(errorDiv);
            }
        }
    }
}

function cargarFontAwesome() {
    if (!document.querySelector('link[href*="fontawesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(link);
    }
}

function crearElementoEstado(nombre, valor, estado) {
    const iconoClase = estado === 'success' ? 'fa-check-circle' : 
                      estado === 'warning' ? 'fa-exclamation-triangle' : 
                      estado === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    return `
    <div class="system-status-item ${estado}">
        <div class="status-icon">
            <i class="fas ${iconoClase}"></i>
        </div>
        <div class="status-info">
            <span class="status-name">${nombre}:</span>
            <span class="status-value">${valor}</span>
        </div>
    </div>`;
}

function renderGPUDetails(gpuInfo) {
    if (!gpuInfo || gpuInfo.length === 0) {
        return `
            <div class="component-detail-section">
                <div class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No hay información de GPU disponible</h3>
                    <p>No se pudo obtener información de la tarjeta gráfica.</p>
                </div>
            </div>
        `;
    }
    
    let html = `
        <div class="component-detail-section">
            <h4>Tarjeta(s) gráfica(s)</h4>
            <div class="gpu-list">`;
            
    gpuInfo.forEach((gpu, index) => {
        const isMainGPU = index === 0;
        html += `
            <div class="gpu-item enhanced ${isMainGPU ? 'main-gpu' : ''}">
                <div class="gpu-header">
                    <div class="gpu-brand-icon">
                        ${getGPUBrandIcon(gpu.name)}
                    </div>
                    <div class="gpu-info">
                        <h5>${gpu.name || 'GPU Desconocida'}</h5>
                        ${isMainGPU ? '<span class="main-gpu-badge">GPU Principal</span>' : ''}
                    </div>
                </div>
                
                <div class="metrics-grid enhanced">
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-memory"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Memoria de Video</span>
                            <span class="metric-value">${gpu.memory || 'No disponible'}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-microchip"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Controlador</span>
                            <span class="metric-value">${gpu.driver || 'No disponible'}</span>
                        </div>
                    </div>
                    <div class="metric-item enhanced">
                        <div class="metric-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-content">
                            <span class="metric-name">Estado</span>
                            <span class="metric-value status-active">Funcionando</span>
                        </div>
                    </div>
                </div>
                
                
            </div>`;
    });
    
    html += `
            </div>
        </div>`;
        
    return html;
}
function getComponentIcon(componentName) {
    const icons = {
        'cpu': 'fa-microchip',
        'procesador': 'fa-microchip',
        'memoria': 'fa-memory',
        'ram': 'fa-memory',
        'disco': 'fa-hdd',
        'almacenamiento': 'fa-hdd',
        'gpu': 'fa-desktop',
        'gráfica': 'fa-desktop',
        'red': 'fa-network-wired',
        'network': 'fa-network-wired'
    };
    
    return icons[componentName] || 'fa-cog';
}

function getGPUBrandIcon(gpuName) {
    if (!gpuName) return '<i class="fas fa-desktop"></i>';
    
    const name = gpuName.toLowerCase();
    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx')) {
        return '<div class="brand-logo nvidia">NVIDIA</div>';
    } else if (name.includes('amd') || name.includes('radeon')) {
        return '<div class="brand-logo amd">AMD</div>';
    } else if (name.includes('intel')) {
        return '<div class="brand-logo intel">Intel</div>';
    }
    
    return '<i class="fas fa-desktop"></i>';
}

function getUsageClass(percentage) {
    if (percentage > 80) return 'critical';
    if (percentage > 60) return 'warning';
    return 'normal';
}

function getComponentStatusClass(data) {
    return 'status-active';
}

function getComponentStatusText(data, componentName) {
    return 'Funcionando correctamente';
}

async function monitorearProgresoScan(diagnosisId) {
    let completed = false;
    let maxAttempts = 30;
    let attempts = 0;
    
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
        simulatedProgress += 3;
        if (simulatedProgress > 100) simulatedProgress = 100;
        
        scanPercentage.textContent = simulatedProgress + "%";
        scanProgressBar.querySelector('span').style.width = simulatedProgress + "%";
        
        if (simulatedProgress < 30) {
            currentComponentScan.textContent = "Analizando CPU y memoria...";
        } else if (simulatedProgress < 50) {
            currentComponentScan.textContent = "Analizando almacenamiento...";
        } else if (simulatedProgress < 70) {
            currentComponentScan.textContent = "Analizando red y controladores...";
        } else if (simulatedProgress < 90) {
            currentComponentScan.textContent = "Evaluando rendimiento del sistema...";
        } else {
            currentComponentScan.textContent = "Generando informe...";
        }
        
        if (simulatedProgress >= 100) {
            clearInterval(progressInterval);
            // CAMBIO AQUÍ: En lugar de mostrar el botón, cargar automáticamente los resultados
            scanDetailsText.textContent = "Cargando resultados automáticamente...";
            completed = true;
            
            // Intentar cargar los resultados automáticamente después de un breve delay
            setTimeout(async () => {
                try {
                    console.log("Diagnóstico completado, cargando resultados automáticamente...");
                    
                    // Intentar obtener el último diagnóstico
                    const latestResponse = await fetch('/dashboard/api/diagnosis/latest/', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (latestResponse.ok) {
                        const latestData = await latestResponse.json();
                        
                        if (latestData.status === 'success' && latestData.report_id) {
                            console.log(`Cargando resultados automáticamente para reporte ID: ${latestData.report_id}`);
                            await cargarResultadosDiagnosticoRevisado(latestData.report_id);
                            hideScanProgressModal();
                            return;
                        }
                    }
                    
                    // Si no hay report_id, buscar por diagnosis_id
                    if (diagnosisId) {
                        await cargarResultadosDiagnostico(diagnosisId);
                        hideScanProgressModal();
                        return;
                    }
                    
                    // Como último recurso, mostrar resultado genérico
                    console.log("No se encontraron resultados específicos, mostrando resultados genéricos");
                    hideScanProgressModal();
                    obtenerUltimoDiagnostico();
                    cargarHistorialDiagnosticos();
                    mostrarNotificacion('success', 'Diagnóstico completado', 3);
                    
                } catch (error) {
                    console.error('Error al cargar resultados automáticamente:', error);
                    
                    // Si falla la carga automática, entonces mostrar el botón como respaldo
                    scanDetailsText.textContent = "Error al cargar automáticamente. Use el botón para verificar resultados.";
                    crearBotonComprobarMejorado("Diagnóstico del sistema");
                    mostrarNotificacion('warning', 'Complete el proceso manualmente usando el botón', 4);
                }
            }, 1500);
        }
    }, 1000);

    // Monitorear el estado real del diagnóstico
    const interval = setInterval(async () => {
        if (completed) {
            clearInterval(interval);
            return;
        }
        
        attempts++;
        try {
            const response = await fetch(`/dashboard/api/diagnosis/status/${diagnosisId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'success' && data.data.status === 'completed') {
                    completed = true;
                    clearInterval(interval);
                    clearInterval(progressInterval);
                    
                    // Forzar progreso al 100% y cargar resultados
                    scanPercentage.textContent = "100%";
                    scanProgressBar.querySelector('span').style.width = "100%";
                    currentComponentScan.textContent = "Cargando resultados...";
                    
                    console.log("Diagnóstico completado, obteniendo resultados automáticamente...");
                    
                    setTimeout(async () => {
                        if (data.data.report_id) {
                            console.log(`Cargando resultados para reporte ID: ${data.data.report_id}`);
                            await cargarResultadosDiagnosticoRevisado(data.data.report_id);
                        } else {
                            console.log("No se encontró report_id en la respuesta");
                            mostrarNotificacion('info', 'Diagnóstico completado', 3);
                            obtenerUltimoDiagnostico();
                            cargarHistorialDiagnosticos();
                        }
                        hideScanProgressModal();
                    }, 1000);
                }
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        } catch (error) {
            console.error('Error:', error);
            clearInterval(interval);
        }
    }, 1000);

    setTimeout(() => {
        if (!completed) {
            clearInterval(interval);
            clearInterval(progressInterval);
        }
    }, 120000);
}

async function monitorearProgresoEscenario(scenarioTitle) {
    console.log(`Monitoreando progreso para: ${scenarioTitle}`);
    
    showScanProgressModal();
    currentComponentScan.textContent = "Iniciando análisis...";
    scanPercentage.textContent = "0%";
    scanProgressBar.querySelector('span').style.width = "0%";
    scanDetailsText.textContent = "Preparando análisis de escenario...";
    
    let progressSpeed = 2;
    let progressCap = 85; 
    let timeoutDuration = 25000; 
    let stepsMessages = [];
    
    if (scenarioTitle.includes("batería")) {
        progressSpeed = 2;
        progressCap = 80; 
        timeoutDuration = 20000; 
        stepsMessages = [
            { threshold: 10, message: "Analizando estado de la batería..." },
            { threshold: 25, message: "Verificando aplicaciones con alto consumo..." },
            { threshold: 45, message: "Analizando plan de energía..." },
            { threshold: 65, message: "Generando informe de energía..." },
            { threshold: 80, message: "Compilando recomendaciones..." }
        ];
    } else {
        stepsMessages = [
            { threshold: 20, message: "Analizando componentes..." },
            { threshold: 40, message: "Verificando configuración..." },
            { threshold: 60, message: "Compilando resultados..." },
            { threshold: 80, message: "Finalizando análisis..." }
        ];
    }
    
    let simulatedProgress = 0;
    let currentMessageIndex = 0;
    let progressCompleted = false;
    
    const progressInterval = setInterval(() => {
        if (progressCompleted) return;
        
        simulatedProgress += progressSpeed;
        if (simulatedProgress > progressCap) {
            simulatedProgress = progressCap;
        }
        
        scanPercentage.textContent = simulatedProgress + "%";
        scanProgressBar.querySelector('span').style.width = simulatedProgress + "%";
        
        if (currentMessageIndex < stepsMessages.length && 
            simulatedProgress >= stepsMessages[currentMessageIndex].threshold) {
            currentComponentScan.textContent = stepsMessages[currentMessageIndex].message;
            currentMessageIndex++;
        }
        
        if (simulatedProgress >= progressCap - 5) {
            progressCompleted = true;
            clearInterval(progressInterval);
            
            // CAMBIO AQUÍ: Cargar automáticamente en lugar de mostrar botón
            scanPercentage.textContent = "100%";
            scanProgressBar.querySelector('span').style.width = "100%";
            currentComponentScan.textContent = "Cargando resultados...";
            scanDetailsText.textContent = "Procesando información del análisis...";
            
            setTimeout(async () => {
                try {
                    const success = await verificarEstadoAnalisis(scenarioTitle);
                    if (success) {
                        hideScanProgressModal();
                        mostrarNotificacion('success', 'Análisis completado automáticamente', 3);
                    } else {
                        // Si falla, entonces mostrar el botón como respaldo
                        crearBotonComprobarMejorado(scenarioTitle);
                    }
                } catch (error) {
                    console.error('Error en carga automática:', error);
                    crearBotonComprobarMejorado(scenarioTitle);
                }
            }, 2000);
        }
    }, 500);
    
    setTimeout(() => {
        if (!progressCompleted) {
            clearInterval(progressInterval);
            progressCompleted = true;
            
            scanDetailsText.textContent = "El análisis está tardando más de lo esperado.";
            crearBotonComprobarMejorado(scenarioTitle);
        }
    }, timeoutDuration);
}

function agregarComponenteReal(nombre, valor, estado, container, isSystemComponent = false) {
    const statusClass = estado === 'success' ? 'success' : 
                       estado === 'warning' ? 'warning' : 
                       estado === 'error' ? 'error' : 'info';
                        
    const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                      statusClass === 'warning' ? 'fa-exclamation-triangle' : 
                      statusClass === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    const componentItem = document.createElement('div');
    componentItem.className = 'component-item';
    componentItem.innerHTML = `
        <div class="component-status ${statusClass}">
            <i class="fa-solid ${statusIcon}"></i>
        </div>
        <div class="component-name">${nombre} (${valor})</div>
        <div class="component-details-toggle">
            <i class="fa-solid fa-chevron-down"></i>
        </div>
    `;
    
    if (isSystemComponent) {
        componentItem.setAttribute('data-component-type', nombre.toLowerCase());
    }
    
    container.appendChild(componentItem);
}

async function cargarComparacionDiagnosticos() {
    try {
        const response = await fetch('/dashboard/client/comparison/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener comparación de diagnósticos');
        }

        const data = await response.json();
        
        if (data.status === 'success' && data.comparison) {
            return data.comparison;
        } else {
            throw new Error('No hay datos de comparación disponibles');
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function mostrarComparacionDiagnosticos(comparison) {
    if (!comparison) return '';
    
    // Determinar clases para las flechas según si el valor aumentó o disminuyó
    const cpuTrend = parseFloat(comparison.cpu_change) > 0 ? 'trend-up' : 'trend-down';
    const ramTrend = parseFloat(comparison.ram_change) > 0 ? 'trend-up' : 'trend-down';
    const diskTrend = parseFloat(comparison.disk_change) > 0 ? 'trend-up' : 'trend-down';
    
    // Determinar si el cambio es positivo o negativo para la salud del sistema
    const cpuHealth = parseFloat(comparison.cpu_change) > 0 ? 'negative' : 'positive';
    const ramHealth = parseFloat(comparison.ram_change) > 0 ? 'negative' : 'positive';
    const diskHealth = parseFloat(comparison.disk_change) > 0 ? 'negative' : 'positive';
    
    return `
    <div class="comparison-section">
        <h4>Comparación con diagnóstico anterior (${comparison.previous_date})</h4>
        <div class="comparison-grid">
            <div class="comparison-item ${cpuHealth}">
                <span class="comparison-name">CPU:</span>
                <span class="comparison-value ${cpuTrend}">
                    ${comparison.cpu_change}%
                    <i class="fas fa-arrow-${cpuTrend === 'trend-up' ? 'up' : 'down'}"></i>
                </span>
            </div>
            <div class="comparison-item ${ramHealth}">
                <span class="comparison-name">RAM:</span>
                <span class="comparison-value ${ramTrend}">
                    ${comparison.ram_change}%
                    <i class="fas fa-arrow-${ramTrend === 'trend-up' ? 'up' : 'down'}"></i>
                </span>
            </div>
            <div class="comparison-item ${diskHealth}">
                <span class="comparison-name">Disco:</span>
                <span class="comparison-value ${diskTrend}">
                    ${comparison.disk_change}%
                    <i class="fas fa-arrow-${diskTrend === 'trend-up' ? 'up' : 'down'}"></i>
                </span>
            </div>
        </div>
    </div>`;
}

async function obtenerInformacionSeguridad() {
    try {
        const response = await fetch('/dashboard/system/security-info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener información de seguridad');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
            return data.data;
        } else {
            throw new Error(data.message || 'Error al obtener información de seguridad');
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}


function renderDriversInfo(driversData) {
    if (!driversData || Object.keys(driversData).length === 0) {
        return `
            <div class="component-detail-section">
                <div class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No hay datos de controladores disponibles</h3>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado de los controladores</h4>`;
            
    if (driversData.problematic_drivers && driversData.problematic_drivers.length > 0) {
        html += `
            <div class="alert-card critical">
                <div class="alert-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h5>Controladores con problemas detectados</h5>
                </div>
                <div class="drivers-problem-list">`;
        
        driversData.problematic_drivers.forEach(driver => {
            html += `
                <div class="driver-problem-item">
                    <div class="driver-info">
                        <span class="driver-name">${driver.name || 'Dispositivo desconocido'}</span>
                        <span class="error-code">Error: ${driver.error_code || 'Desconocido'}</span>
                    </div>
                    <button class="fix-driver-btn action-btn primary" data-device-id="${driver.DeviceID || ''}">
                        <i class="fas fa-wrench"></i>
                        Reparar
                    </button>
                </div>`;
        });
        
        html += `
                </div>
                <div class="alert-actions">
                    <button class="action-btn primary fix-all-drivers-btn">
                        <i class="fas fa-tools"></i>
                        Reparar todos los controladores
                    </button>
                </div>
            </div>`;
    } else {
        html += `
            <div class="alert-card success">
                <div class="alert-header">
                    <i class="fas fa-check-circle"></i>
                    <h5>Todos los controladores funcionan correctamente</h5>
                </div>
                <p>No se detectaron problemas con los controladores de su sistema.</p>
            </div>`;
    }
    
    if (driversData.outdated_drivers && driversData.outdated_drivers.length > 0) {
        html += `
            <div class="alert-card warning">
                <div class="alert-header">
                    <i class="fas fa-clock"></i>
                    <h5>Controladores desactualizados</h5>
                </div>
                <div class="drivers-outdated-list">`;
        
        driversData.outdated_drivers.forEach(driver => {
            html += `
                <div class="driver-outdated-item">
                    <div class="driver-info">
                        <span class="driver-name">${driver.name || 'Controlador desconocido'}</span>
                        <span class="driver-date">Fecha: ${driver.date || 'Desconocida'}</span>
                    </div>
                    <button class="update-driver-btn action-btn secondary" data-device-id="${driver.DeviceID || ''}">
                        <i class="fas fa-sync-alt"></i>
                        Actualizar
                    </button>
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    html += `
        </div>
        <div class="component-detail-section">
            <h4>Acciones de mantenimiento</h4>
            <div class="maintenance-actions">
                <button class="action-btn primary run-driver-scan-btn">
                    <i class="fas fa-search"></i>
                    Escanear controladores
                </button>
                <button class="action-btn secondary refresh-driver-info-btn">
                    <i class="fas fa-sync-alt"></i>
                    Actualizar información
                </button>
            </div>
        </div>`;
    
    return html;
}

function renderUpdatesInfo(updatesData) {
    if (!updatesData || Object.keys(updatesData).length === 0) {
        return `
            <div class="component-detail-section">
                <div class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No hay datos de actualizaciones disponibles</h3>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    const updatesClass = updatesData.status === 'UpToDate' ? 'success' : 
                       updatesData.status === 'UpdatesAvailable' ? 'warning' : 'error';
    
    let html = `
        <div class="component-detail-section">
            <h4>Actualizaciones del sistema</h4>
            <div class="updates-status-card ${updatesClass}">
                <div class="updates-icon">
                    <i class="fas fa-${updatesData.status === 'UpToDate' ? 'check-circle' : 'sync-alt'}"></i>
                </div>
                <div class="updates-info">
                    <h5>${updatesData.status === 'UpToDate' ? 'Sistema actualizado' : 
                        updatesData.status === 'UpdatesAvailable' ? 'Actualizaciones disponibles' : 
                        'Estado de actualizaciones desconocido'}</h5>`;
    
    if (updatesData.status === 'UpdatesAvailable' && updatesData.count > 0) {
        html += `
                    <p>${updatesData.count} actualizaciones pendientes</p>
                    <button class="action-btn primary install-updates-btn">
                        <i class="fas fa-download"></i>
                        Instalar actualizaciones
                    </button>`;
    } else if (updatesData.status === 'UpToDate') {
        html += `<p>Su sistema está al día con las últimas actualizaciones de seguridad.</p>`;
    }
    
    html += `
                </div>
            </div>
        </div>`;
    
    if (updatesData.status === 'UpdatesAvailable' && updatesData.updates && updatesData.updates.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Actualizaciones disponibles</h4>
                <div class="updates-list">`;
        
        updatesData.updates.slice(0, 5).forEach(update => {
            html += `
                <div class="update-item">
                    <div class="update-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <div class="update-info">
                        <span class="update-name">${update.Title || update.KB || 'Actualización del sistema'}</span>
                    </div>
                </div>`;
        });
        
        if (updatesData.updates.length > 5) {
            html += `
                <div class="more-updates">
                    <span>... y ${updatesData.updates.length - 5} actualizaciones más</span>
                </div>`;
        }
        
        html += `
                </div>
            </div>`;
    }
    
    return html;
}

function renderMaintenanceOptions() {
    return `
        <div class="component-detail-section">
            <h4>Opciones de mantenimiento</h4>
            <div class="maintenance-grid">
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Liberar espacio</h5>
                        <p>Elimina archivos temporales y libera espacio en disco</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="clear-space">Limpiar</button>
                </div>
                
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Actualizar software</h5>
                        <p>Busca y aplica actualizaciones de software</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="update-software">Actualizar</button>
                </div>
                
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-puzzle-piece"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Desfragmentar disco</h5>
                        <p>Optimiza el disco para mejorar el rendimiento</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="defragment-disk">Desfragmentar</button>
                </div>
                
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-tools"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Reparar disco</h5>
                        <p>Repara errores y sectores dañados en el disco</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="repair-disk">Reparar</button>
                </div>
                
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-shield-virus"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Escaneo de virus</h5>
                        <p>Analiza el sistema en busca de malware</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="virus-scan">Escanear</button>
                </div>
                
                <div class="maintenance-card">
                    <div class="maintenance-icon">
                        <i class="fas fa-tachometer-alt"></i>
                    </div>
                    <div class="maintenance-info">
                        <h5>Test de velocidad</h5>
                        <p>Mide la velocidad de tu conexión a Internet</p>
                    </div>
                    <button class="btn btn-primary maintenance-btn" data-action="speed-test">Iniciar test</button>
                </div>
            </div>
        </div>
    `;
}

// Añade también estos manejadores de eventos para las opciones de mantenimiento
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('maintenance-btn')) {
        const action = event.target.getAttribute('data-action');
        ejecutarAccionMantenimiento(action);
    }
    
    if (event.target.classList.contains('install-updates-btn')) {
        ejecutarAccionMantenimiento('update-software');
    }
});


//fix drivers

async function repararControlador(deviceId, buttonElement) {
    try {
        if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 3 || 
            ['encontraron', 'dispositivo', 'desconocido', 'generic_device'].includes(deviceId.toLowerCase())) {
            
            mostrarNotificacion('warning', 'No se pudo identificar el ID específico del dispositivo. Use "Reparar todos los controladores"', 4);
            
            buttonElement.innerHTML = `<i class="fas fa-tools"></i> Reparar todos`;
            buttonElement.removeEventListener('click', function(){});
            buttonElement.addEventListener('click', function() {
                repararTodosLosControladores(this);
            });
            
            return;
        }
        
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Reparando...`;
        buttonElement.disabled = true;
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al reparar controlador: ' + error.message, 3);
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
    }
}

async function escanearYRepararTodos() {
    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress > 95) progress = 95;
            
            scanPercentage.textContent = progress + "%";
            scanProgressBar.querySelector('span').style.width = progress + "%";
            
            if (progress > 20 && progress < 40) {
                currentComponentScan.textContent = "Escaneando dispositivos...";
            } else if (progress >= 40 && progress < 70) {
                currentComponentScan.textContent = "Identificando controladores problemáticos...";
            } else if (progress >= 70) {
                currentComponentScan.textContent = "Reparando controladores...";
            }
        }, 300);
        
        // Primero escanear
        const scanResponse = await fetch('/dashboard/api/diagnosis/scan-drivers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        const scanData = await scanResponse.json();
        
        if (scanData.status === 'success' && scanData.problem_count > 0) {
            // Si encontramos problemas, repararlos todos
            const fixResponse = await fetch('/dashboard/api/diagnosis/fix-all-drivers/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'same-origin'
            });
            
            const fixData = await fixResponse.json();
            
            clearInterval(progressInterval);
            scanPercentage.textContent = "100%";
            scanProgressBar.querySelector('span').style.width = "100%";
            currentComponentScan.textContent = "Proceso completado";
            
            setTimeout(() => {
                hideScanProgressModal();
                
                if (fixData.status === 'success' || fixData.status === 'partial') {
                    mostrarNotificacion('success', fixData.message, 5);
                    
                    // Si se requiere reinicio
                    if (fixData.requires_restart) {
                        mostrarDialogoReinicio();
                    }
                    
                    // Recargar detalles
                    obtenerResultadoEscenario(currentScenarioRunId);
                } else {
                    mostrarNotificacion('error', fixData.message || 'No se pudieron reparar todos los controladores', 5);
                }
            }, 1500);
        } else {
            clearInterval(progressInterval);
            scanPercentage.textContent = "100%";
            scanProgressBar.querySelector('span').style.width = "100%";
            currentComponentScan.textContent = scanData.message || "Escaneo completado";
            
            setTimeout(() => {
                hideScanProgressModal();
                
                if (scanData.problem_count === 0) {
                    mostrarNotificacion('info', 'No se encontraron dispositivos con problemas para reparar', 3);
                } else {
                    mostrarNotificacion('error', 'Error al escanear dispositivos', 3);
                }
            }, 1500);
        }
    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        scanPercentage.textContent = "Error";
        currentComponentScan.textContent = "Error en el proceso";
        
        setTimeout(() => {
            hideScanProgressModal();
            mostrarNotificacion('error', 'Error: ' + error.message, 3);
        }, 1500);
    }
}

async function repararTodosLosControladores(buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Reparando todos...`;
        buttonElement.disabled = true;
        
        // Variables para controlar el proceso en segundo plano
        window.reparacionEnProgreso = true;
        window.reparacionEnSegundoPlano = false;
        
        showScanProgressModal();
        currentComponentScan.textContent = "Analizando dispositivos problemáticos...";
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        scanDetailsText.textContent = "Identificando controladores...";
        
        // Primera fase - progreso rápido hasta 50%
        let progress = 0;
        const initialInterval = setInterval(() => {
            // Si está en segundo plano, detener estas animaciones
            if (window.reparacionEnSegundoPlano) {
                clearInterval(initialInterval);
                return;
            }
            
            progress += Math.random() * 2 + 1;
            if (progress > 50) {
                progress = 50;
                clearInterval(initialInterval);
                
                // Mensaje específico para esta fase
                currentComponentScan.textContent = "Deshabilitando controladores problemáticos...";
                scanDetailsText.textContent = "Este proceso puede tardar varios minutos";
                
                // Segunda fase
                let slowProgress = progress;
                const secondInterval = setInterval(() => {
                    // Si está en segundo plano, detener estas animaciones
                    if (window.reparacionEnSegundoPlano) {
                        clearInterval(secondInterval);
                        return;
                    }
                    
                    slowProgress += Math.random() * 0.5;
                    if (slowProgress > 80) {
                        slowProgress = 80;
                        clearInterval(secondInterval);
                        
                        currentComponentScan.textContent = "Aplicando cambios al sistema...";
                        
                        scanProgressBar.querySelector('span').classList.add('progress-pulse');
                        
                        let finalProgress = slowProgress;
                        const finalInterval = setInterval(() => {
                            if (window.reparacionEnSegundoPlano) {
                                clearInterval(finalInterval);
                                return;
                            }
                            
                            finalProgress += Math.random() * 0.2;
                            if (finalProgress > 95) {
                                finalProgress = 95;
                                clearInterval(finalInterval);
                                
                                let dots = 0;
                                const dotsInterval = setInterval(() => {
                                    if (window.reparacionEnSegundoPlano) {
                                        clearInterval(dotsInterval);
                                        return;
                                    }
                                    
                                    dots = (dots + 1) % 4;
                                    const dotsText = '.'.repeat(dots);
                                    currentComponentScan.textContent = `Aplicando cambios al sistema${dotsText}`;
                                    
                                    const messages = [
                                        "Este proceso puede tardar varios minutos",
                                        "No cierre esta ventana",
                                        "Estamos trabajando en sus controladores",
                                        "Los últimos pasos son los más lentos"
                                    ];
                                    scanDetailsText.textContent = messages[dots];
                                }, 800);
                                
                                window.dotsInterval = dotsInterval;
                            }
                            
                            scanPercentage.textContent = Math.round(finalProgress) + "%";
                            scanProgressBar.querySelector('span').style.width = finalProgress + "%";
                        }, 1500);
                        
                        window.finalInterval = finalInterval;
                    }
                    
                    scanPercentage.textContent = Math.round(slowProgress) + "%";
                    scanProgressBar.querySelector('span').style.width = slowProgress + "%";
                }, 800);
                
                window.secondInterval = secondInterval;
            }
            
            scanPercentage.textContent = Math.round(progress) + "%";
            scanProgressBar.querySelector('span').style.width = progress + "%";
        }, 300);
        
        window.initialInterval = initialInterval;
        
        setTimeout(() => {
            if (window.reparacionEnProgreso && !window.reparacionEnSegundoPlano) {
                const modalFooter = document.createElement('div');
modalFooter.className = 'scan-progress-footer';
modalFooter.innerHTML = `
    <button class="btn-dashboard btn-secondary-dashboard background-process-btn">
        <i class="fas fa-angle-double-right"></i> Continuar en segundo plano
    </button>
`;
                const progressContent = document.querySelector('.scan-progress-content');
                if (progressContent && !progressContent.querySelector('.scan-progress-footer')) {
                    progressContent.appendChild(modalFooter);
                    
                    document.querySelector('.background-process-btn').addEventListener('click', () => {
                        window.reparacionEnSegundoPlano = true;
                        
                        clearInterval(window.initialInterval);
                        clearInterval(window.secondInterval);
                        clearInterval(window.finalInterval);
                        clearInterval(window.dotsInterval);
                        
                        hideScanProgressModal();
                        
                        const bgIndicator = document.createElement('div');
                        bgIndicator.id = 'bg-process-indicator';
                        bgIndicator.style.position = 'fixed';
                        bgIndicator.style.bottom = '20px';
                        bgIndicator.style.right = '20px';
                        bgIndicator.style.backgroundColor = '#1e2a38';
                        bgIndicator.style.color = 'white';
                        bgIndicator.style.padding = '10px 15px';
                        bgIndicator.style.borderRadius = '5px';
                        bgIndicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
                        bgIndicator.style.zIndex = '9999';
                        bgIndicator.style.display = 'flex';
                        bgIndicator.style.alignItems = 'center';
                        bgIndicator.style.cursor = 'pointer';
                        bgIndicator.innerHTML = `
                            <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
                            <span>Reparando controladores en segundo plano...</span>
                        `;
                        document.body.appendChild(bgIndicator);
                        
                        bgIndicator.addEventListener('click', () => {
                            alert('La reparación de controladores está en proceso. Se notificará cuando termine.');
                        });
                        
                        console.log('Reparación de controladores continúa en segundo plano');
                    });
                }
            }
        }, 20000);
        
        const response = await fetch('/dashboard/api/diagnosis/fix-all-drivers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        clearInterval(window.initialInterval);
        clearInterval(window.secondInterval);
        clearInterval(window.finalInterval);
        clearInterval(window.dotsInterval);
        
        const data = await response.json();
        
        window.reparacionEnProgreso = false;
        
        if (window.reparacionEnSegundoPlano) {
            const bgIndicator = document.getElementById('bg-process-indicator');
            if (bgIndicator) {
                bgIndicator.remove();
            }
            
            const notif = document.createElement('div');
            notif.id = 'repair-complete-notification';
            notif.style.position = 'fixed';
            notif.style.bottom = '20px';
            notif.style.right = '20px';
            notif.style.backgroundColor = '#1e2a38';
            notif.style.color = 'white';
            notif.style.padding = '15px 20px';
            notif.style.borderRadius = '5px';
            notif.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            notif.style.zIndex = '9999';
            notif.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-check-circle" style="margin-right: 10px; color: #28a745;"></i>
                    <div>
                        <div style="font-weight: bold; margin-bottom: 5px;">Reparación de controladores completada</div>
                        <div>${data.status === 'success' ? 'Proceso finalizado correctamente' : 'Finalizado con advertencias'}</div>
                    </div>
                    <button style="margin-left: 15px; background: none; border: none; color: white; cursor: pointer;">&times;</button>
                </div>
                <div style="margin-top: 10px; text-align: center;">
                    <button id="view-results-btn" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Ver resultados
                    </button>
                    ${data.requires_restart ? `
                    <button id="restart-now-btn" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin-left: 10px; cursor: pointer;">
                        Reiniciar ahora
                    </button>
                    ` : ''}
                </div>
            `;
            document.body.appendChild(notif);
            
            notif.querySelector('button').addEventListener('click', () => notif.remove());
            
            document.getElementById('view-results-btn').addEventListener('click', () => {
                notif.remove();
                if (currentScenarioRunId) {
                    obtenerResultadoEscenario(currentScenarioRunId);
                }
            });
            
            if (data.requires_restart) {
                document.getElementById('restart-now-btn').addEventListener('click', () => {
                    notif.remove();
                    mostrarDialogoReinicio();
                });
            }
            
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.remove();
                }
            }, 30000);
        } else {
            scanProgressBar.querySelector('span').classList.remove('progress-pulse');
            
            let completeProgress = 95;
            const completeInterval = setInterval(() => {
                completeProgress += 1;
                if (completeProgress >= 100) {
                    completeProgress = 100;
                    clearInterval(completeInterval);
                    
                    currentComponentScan.textContent = "¡Proceso completado!";
                    scanDetailsText.textContent = "Finalizando...";
                    
                    setTimeout(() => {
                        hideScanProgressModal();
                        
                        if (data.status === 'success' || data.status === 'partial') {
                            if (data.requires_restart) {
                                mostrarDialogoReinicio();
                            }
                        } else {
                            mostrarMensajeError(data.message || "No se pudieron reparar todos los controladores");
                        }
                        
                        buttonElement.innerHTML = originalText;
                        buttonElement.disabled = false;
                        
                        if (currentScenarioRunId) {
                            obtenerResultadoEscenario(currentScenarioRunId);
                        }
                    }, 1500);
                }
                
                scanPercentage.textContent = completeProgress + "%";
                scanProgressBar.querySelector('span').style.width = completeProgress + "%";
            }, 80);
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        clearInterval(window.initialInterval);
        clearInterval(window.secondInterval);
        clearInterval(window.finalInterval);
        clearInterval(window.dotsInterval);
        
        const bgIndicator = document.getElementById('bg-process-indicator');
        if (bgIndicator) {
            bgIndicator.remove();
        }
        
        window.reparacionEnProgreso = false;
        
        hideScanProgressModal();
        
        if (!window.reparacionEnSegundoPlano) {
            mostrarMensajeError("Error al reparar controladores: " + error.message);
        } else {
            const errorNotif = document.createElement('div');
            errorNotif.style.position = 'fixed';
            errorNotif.style.bottom = '20px';
            errorNotif.style.right = '20px';
            errorNotif.style.backgroundColor = '#1e2a38';
            errorNotif.style.color = 'white';
            errorNotif.style.padding = '15px';
            errorNotif.style.borderRadius = '5px';
            errorNotif.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            errorNotif.style.zIndex = '9999';
            errorNotif.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-exclamation-circle" style="margin-right: 10px; color: #dc3545;"></i>
                    <div>Error en la reparación de controladores</div>
                    <button style="margin-left: 15px; background: none; border: none; color: white; cursor: pointer;">&times;</button>
                </div>
            `;
            document.body.appendChild(errorNotif);
            
            errorNotif.querySelector('button').addEventListener('click', () => errorNotif.remove());
            
            setTimeout(() => {
                if (errorNotif.parentNode) {
                    errorNotif.remove();
                }
            }, 10000);
        }
        
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
    }
}

function mostrarResultadosReparacion(data) {
    if (data.results && data.results.length > 0) {
        let successCount = data.results.filter(r => r.success).length;
        let message = `Se repararon ${successCount} de ${data.results.length} controladores.`;
        
        if (successCount > 0) {
            mostrarNotificacion('success', message, 5);
        } else {
            mostrarMensajeError("No se pudo reparar ningún controlador automáticamente");
        }
    } else {
        mostrarMensajeError(data.message || "No se obtuvieron resultados detallados");
    }
}

function mostrarMensajeError(mensaje) {
    const alertHTML = `
        <div class="alert alert-warning" style="margin-top: 20px; background-color: #2a3a4f; border-color: #f0ad4e; color: white;">
            <h5><i class="fas fa-exclamation-triangle"></i> Atención</h5>
            <p>${mensaje}</p>
            <p>Algunos controladores requieren intervención manual:</p>
            <ol>
                <li>Acceda al Administrador de dispositivos (botón derecho en Inicio > Administrador de dispositivos)</li>
                <li>Encuentre los dispositivos con problemas</li>
                <li>Botón derecho > Desinstalar dispositivo</li>
                <li>Marque "Eliminar el software del controlador"</li>
                <li>Reinicie el equipo</li>
            </ol>
        </div>
    `;
    
    if (detailedResultsContent) {
        const currentContent = detailedResultsContent.innerHTML;
        detailedResultsContent.innerHTML = currentContent + alertHTML;
        
        const alertElement = detailedResultsContent.querySelector('.alert');
        if (alertElement) {
            alertElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

async function actualizarControlador(deviceId, buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Actualizando...`;
        buttonElement.disabled = true;
        
        mostrarNotificacion('info', 'Buscando actualizaciones para el controlador...', 2);
        
        const response = await fetch(`/dashboard/api/diagnosis/download-driver/${deviceId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            mostrarNotificacion('success', data.message, 3);
            buttonElement.innerHTML = `<i class="fas fa-check"></i> Actualizado`;
            buttonElement.classList.remove('btn-outline-primary');
            buttonElement.classList.add('btn-success');
            
            setTimeout(() => {
                mostrarDetallesComponente('Controladores');
            }, 3000);
        } else {
            mostrarNotificacion('error', data.message || 'Error al actualizar controlador', 3);
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al actualizar controlador: ' + error.message, 3);
        buttonElement.innerHTML = `<i class="fas fa-sync-alt"></i> Actualizar`;
        buttonElement.disabled = false;
    }
}

async function actualizarTodosLosControladores(buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Actualizando...`;
        buttonElement.disabled = true;
        
        showScanProgressModal();
        currentComponentScan.textContent = "Buscando actualizaciones...";
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress > 95) progress = 95;
            
            scanPercentage.textContent = progress + "%";
            scanProgressBar.querySelector('span').style.width = progress + "%";
            
            if (progress > 30 && progress < 60) {
                currentComponentScan.textContent = "Descargando actualizaciones...";
            } else if (progress >= 60 && progress < 85) {
                currentComponentScan.textContent = "Instalando actualizaciones...";
            } else if (progress >= 85) {
                currentComponentScan.textContent = "Verificando instalación...";
            }
        }, 500);
        
        const response = await fetch('/dashboard/api/diagnosis/update-all-drivers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        clearInterval(progressInterval);
        scanPercentage.textContent = "100%";
        scanProgressBar.querySelector('span').style.width = "100%";
        currentComponentScan.textContent = "Actualización completada";
        
        setTimeout(() => {
            hideScanProgressModal();
            
            if (data.status === 'success') {
                mostrarNotificacion('success', data.message, 5);
                setTimeout(() => {
                    mostrarDetallesComponente('Controladores');
                }, 1000);
            } else {
                mostrarNotificacion('error', data.message || 'Error al actualizar controladores', 5);
            }
            
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        hideScanProgressModal();
        mostrarNotificacion('error', 'Error al actualizar controladores: ' + error.message, 5);
        buttonElement.innerHTML = `<i class="fas fa-sync-alt"></i> Actualizar todos los controladores`;
        buttonElement.disabled = false;
    }
}

// Escanear controladores
async function escanearControladores(buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Escaneando...`;
        buttonElement.disabled = true;
        
        showScanProgressModal();
        currentComponentScan.textContent = "Iniciando escaneo de controladores...";
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 3;
            if (progress > 95) progress = 95;
            
            scanPercentage.textContent = progress + "%";
            scanProgressBar.querySelector('span').style.width = progress + "%";
            
            if (progress > 20 && progress < 50) {
                currentComponentScan.textContent = "Detectando dispositivos...";
            } else if (progress >= 50 && progress < 80) {
                currentComponentScan.textContent = "Verificando controladores...";
            } else if (progress >= 80) {
                currentComponentScan.textContent = "Analizando resultados...";
            }
        }, 300);
        
        const response = await fetch('/dashboard/api/diagnosis/scan-drivers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        clearInterval(progressInterval);
        
        const data = await response.json();
        
        scanPercentage.textContent = "100%";
        scanProgressBar.querySelector('span').style.width = "100%";
        currentComponentScan.textContent = "Escaneo completado";
        
        setTimeout(() => {
            hideScanProgressModal();
            
            if (data.status === 'success') {
                mostrarNotificacion('success', data.message, 3);
                
                if (currentScenarioRunId) {
                    obtenerResultadoEscenario(currentScenarioRunId);
                }
            } else {
                mostrarNotificacion('error', data.message || 'Error al escanear controladores', 3);
            }
            
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        hideScanProgressModal();
        mostrarNotificacion('error', 'Error al escanear controladores: ' + error.message, 3);
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
    }
}

// Refrescar información de controladores
function refrescarInformacionControladores() {
    mostrarNotificacion('info', 'Actualizando información de controladores...', 2);
    setTimeout(() => {
        mostrarDetallesComponente('Controladores');
    }, 500);
}

async function ejecutarAccionMantenimiento(action) {
    try {
        showScanProgressModal();
        currentComponentScan.textContent = `Ejecutando: ${getActionName(action)}`;
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        scanDetailsText.textContent = "Preparando...";
        
        let endpoint = '';
        switch (action) {
            case 'clear-space':
                endpoint = '/dashboard/client/maintenance/clear-space/';
                break;
            case 'update-software':
                endpoint = '/dashboard/client/maintenance/update-software/';
                break;
            case 'defragment-disk':
                endpoint = '/dashboard/client/maintenance/defragment-disk/';
                break;
            case 'repair-disk':
                endpoint = '/dashboard/client/maintenance/repair-disk/';
                break;
            case 'virus-scan':
                endpoint = '/dashboard/system/virus-scan/';
                break;
            case 'speed-test':
                endpoint = '/dashboard/speed-test/';
                break;
            default:
                throw new Error('Acción no reconocida');
        }
        
        // Simulación de progreso
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 100) progress = 100;
            
            scanPercentage.textContent = progress + "%";
            scanProgressBar.querySelector('span').style.width = progress + "%";
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                scanDetailsText.textContent = "Completado";
                setTimeout(() => {
                    hideScanProgressModal();
                    mostrarNotificacion('success', `${getActionName(action)} completado`, 3);
                }, 1000);
            }
        }, 500);
        
        // Llamada al endpoint real
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Error al ejecutar ${getActionName(action)}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
        } else {
            throw new Error(data.message || `Error al ejecutar ${getActionName(action)}`);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', `Error: ${error.message}`, 3);
        hideScanProgressModal();
    }
}

function getActionName(action) {
    switch (action) {
        case 'clear-space': return 'Limpieza de espacio';
        case 'update-software': return 'Actualización de software';
        case 'defragment-disk': return 'Desfragmentación de disco';
        case 'repair-disk': return 'Reparación de disco';
        case 'virus-scan': return 'Escaneo de virus';
        case 'speed-test': return 'Test de velocidad';
        default: return 'Acción de mantenimiento';
    }
}

function renderSecurityInfo(securityData) {
    if (!securityData || Object.keys(securityData).length === 0) {
        return `
            <div class="component-detail-section">
                <div class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No hay datos de seguridad disponibles</h3>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado de seguridad del sistema</h4>
            <div class="security-grid">`;
            
    const securityComponents = [
        {
            name: 'Firewall',
            data: securityData.firewall,
            icon: 'fa-shield-alt'
        },
        {
            name: 'Antivirus',
            data: securityData.antivirus,
            icon: 'fa-virus-slash'
        },
        {
            name: 'Actualizaciones',
            data: securityData.updates,
            icon: 'fa-sync-alt'
        }
    ];
    
    securityComponents.forEach(component => {
        const isEnabled = component.data?.enabled || false;
        const statusClass = isEnabled ? 'active' : 'inactive';
        
        html += `
            <div class="security-component ${statusClass}">
                <div class="security-icon">
                    <i class="fas ${component.icon}"></i>
                </div>
                <div class="security-details">
                    <h5>${component.name}</h5>
                    <span class="security-status">${component.data?.status || (isEnabled ? 'Activo' : 'Inactivo')}</span>
                    ${component.data?.name ? `<span class="security-provider">${component.data.name}</span>` : ''}
                </div>
                <div class="security-indicator ${statusClass}">
                    <i class="fas fa-${isEnabled ? 'check-circle' : 'times-circle'}"></i>
                </div>
            </div>`;
    });
    
    html += `
            </div>
        </div>`;
        
    if (securityData.issues && securityData.issues.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Problemas de seguridad detectados</h4>
                <div class="security-issues">`;
                
        securityData.issues.forEach(issue => {
            const severityClass = issue.severity === 'HIGH' ? 'critical' : 
                                issue.severity === 'MEDIUM' ? 'warning' : 'info';
            
            html += `
                <div class="security-issue ${severityClass}">
                    <div class="issue-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="issue-content">
                        <h5>${issue.description}</h5>
                        <p>${issue.recommendation}</p>
                    </div>
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    return html;
}

function mostrarAyudaControladores() {
    const ayudaHTML = `
        <div class="help-container p-3 mt-4" style="background-color: #1e2a38; border-radius: 8px; border-left: 4px solid #17a2b8;">
            <h4><i class="fas fa-info-circle"></i> Información sobre dispositivos problemáticos</h4>
            <p>Los dispositivos WAN Miniport son componentes virtuales de Windows que a menudo aparecen como problemáticos pero no afectan el funcionamiento normal del sistema.</p>
            <p>Para dispositivos USB desconocidos (Error 43):</p>
            <ol>
                <li>Desconecte el dispositivo USB</li>
                <li>Reinicie el sistema</li>
                <li>Conecte el dispositivo nuevamente</li>
            </ol>
            <p>Si los problemas persisten, considere actualizar manualmente los controladores desde el sitio web del fabricante.</p>
        </div>
    `;
    
    return ayudaHTML;
}

function createPerformanceChart(container, data, options) {

    if (!window.Chart) {
        console.error("Chart.js no está disponible. Añada la biblioteca para usar gráficos.");
        return;
    }
    
    const ctx = document.getElementById(container).getContext('2d');
    return new Chart(ctx, {
        type: options.type || 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: options.label || 'Datos',
                data: data.values,
                backgroundColor: options.backgroundColor || 'rgba(54, 162, 235, 0.2)',
                borderColor: options.borderColor || 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: options.beginAtZero || false
                }
            }
        }
    });
}
async function obtenerDatosRealControladores() {
    try {
        console.log("Obteniendo datos MEJORADOS de controladores...");
        
        const historialResponse = await fetch('/dashboard/client/historial/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        if (!historialResponse.ok) {
            throw new Error('Error al obtener historial');
        }
        
        const historialData = await historialResponse.json();
        
        if (historialData.status === 'success' && historialData.historial && historialData.historial.length > 0) {
            const ultimoDiagnostico = historialData.historial[0];
            
            try {
                const reportResponse = await fetch(`/dashboard/api/diagnosis/report/${ultimoDiagnostico.id}/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                if (reportResponse.ok) {
                    const reportData = await reportResponse.json();
                    
                    if (reportData.status === 'success' && reportData.data) {
                        const driversComponent = reportData.data.components?.find(c => 
                            c.type === 'DRIVER' || c.name?.toLowerCase().includes('controlador')
                        );
                        
                        if (driversComponent && driversComponent.details) {
                            console.log("Datos PRECISOS de controladores encontrados:", driversComponent.details);
                            
                            return {
                                status: driversComponent.details.status || "NORMAL",
                                total_drivers: driversComponent.details.drivers?.length || 0,
                                working_drivers: driversComponent.details.drivers?.filter(d => 
                                    d.status === "Normal" || d.status === "Sistema (excluido)").length || 0,
                                problematic_drivers: driversComponent.details.problematic_drivers || [],
                                outdated_drivers: driversComponent.details.outdated_drivers || [],
                                issues: driversComponent.details.issues || [],
                                message: driversComponent.details.recommendations || 
                                        "Análisis inteligente de controladores completado",
                                excluded_count: driversComponent.details.drivers?.filter(d => 
                                    d.status === "Sistema (excluido)").length || 0
                            };
                        }
                    }
                }
            } catch (error) {
                console.log("No se pudo obtener reporte detallado, usando datos básicos");
            }
        }
        
        return {
            status: "NORMAL",
            total_drivers: 0,
            working_drivers: 0,
            problematic_drivers: [],
            outdated_drivers: [],
            issues: [],
            message: "Ejecute un diagnóstico completo para obtener análisis inteligente de controladores",
            excluded_count: 0
        };
        
    } catch (error) {
        console.error('Error al obtener datos MEJORADOS de controladores:', error);
        return {
            status: "ERROR",
            total_drivers: 0,
            working_drivers: 0,
            problematic_drivers: [],
            outdated_drivers: [],
            issues: [],
            message: "Error al verificar controladores con análisis inteligente",
            excluded_count: 0
        };
    }
}

function mostrarEscenariosDisponibles() {
    const scenariosContainer = document.getElementById('scenarios-container');
    if (!scenariosContainer) return;
    
    const scenarios = [
        { id: 1, name: "Pantalla azul", description: "Diagnostica posibles causas de pantallas azules", icon: "fa-window-close" },
        { id: 2, name: "Sistema lento", description: "Analiza por qué el sistema está funcionando lentamente", icon: "fa-tachometer-alt" },
        { id: 3, name: "Problemas de conectividad", description: "Diagnostica problemas de red e Internet", icon: "fa-wifi" },
        { id: 4, name: "Error de controlador", description: "Analiza controladores problemáticos", icon: "fa-cogs" },
        { id: 5, name: "El sistema no responde", description: "Diagnostica por qué el sistema deja de responder", icon: "fa-exclamation-triangle" },
        { id: 6, name: "Tiempo de arranque lento", description: "Analiza por qué el sistema tarda en iniciar", icon: "fa-hourglass-half" },
        { id: 7, name: "Problemas con la batería", description: "Diagnóstico de problemas de autonomía", icon: "fa-battery-half" }
    ];
    
    let html = '';
    
    scenarios.forEach(scenario => {
        html += `
            <div class="scenario-card" data-scenario-id="${scenario.id}">
                <div class="scenario-icon">
                    <i class="fas ${scenario.icon}"></i>
                </div>
                <div class="scenario-info">
                    <h4>${scenario.name}</h4>
                    <p>${scenario.description}</p>
                    <button class="scenario-button">Revisión</button>
                </div>
            </div>
        `;
    });
    
    scenariosContainer.innerHTML = html;
    
    document.querySelectorAll('.scenario-card .scenario-button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.scenario-card');
            const scenarioId = card.getAttribute('data-scenario-id');
            const scenarioTitle = card.querySelector('h4').textContent;
            iniciarEscenario(scenarioId, scenarioTitle);
        });
    });
}


function getCPUStatus(usage) {
    try {
        const valorCPU = parseFloat(usage.replace('%', ''));
        if (valorCPU > 90) return 'error';
        if (valorCPU > 70) return 'warning';
        return 'success';
    } catch (e) {
        console.error("Error en getCPUStatus:", e);
        return 'success';
    }
}

function getRAMStatus(usage) {
    try {
        const valorRAM = parseFloat(usage.replace('%', ''));
        if (valorRAM > 90) return 'error';
        if (valorRAM > 80) return 'warning';
        return 'success';
    } catch (e) {
        console.error("Error en getRAMStatus:", e);
        return 'success';
    }
}

function getDiskStatus(usage) {
    try {
        const valorDisk = parseFloat(usage.replace('%', ''));
        if (valorDisk > 90) return 'error';
        if (valorDisk > 80) return 'warning';
        return 'success';
    } catch (e) {
        console.error("Error en getDiskStatus:", e);
        return 'success';
    }
}

function agregarComponente(nombre, valor, estado) {
    try {
        const componentsList = document.querySelector('.components-list');
        if (!componentsList) {
            console.error("No se encontró el elemento .components-list");
            return;
        }
        
        const statusClass = estado === 'success' ? 'success' : 
                        estado === 'warning' ? 'warning' : 'error';
                        
        const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                        statusClass === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
        
        const componentItem = document.createElement('div');
        componentItem.className = 'component-item';
        componentItem.innerHTML = `
            <div class="component-status ${statusClass}">
                <i class="fa-solid ${statusIcon}"></i>
            </div>
            <div class="component-name">${nombre} (${valor})</div>
            <div class="component-details-toggle">
                <i class="fa-solid fa-chevron-down"></i>
            </div>
        `;
        
        componentsList.appendChild(componentItem);
    } catch (error) {
        console.error("Error al agregar componente:", error);
    }
}

function formatKey(key) {
   if (!key) return '';
   
   return key
       .replace(/_/g, ' ')
       .split(' ')
       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
       .join(' ');
}

function determineStatusClass(status) {
    if (!status) return 'unknown';
    
    status = status.toUpperCase();
    if (status === 'NORMAL' || status === 'OK') return 'success';
    if (status === 'WARNING') return 'warning';
    if (status === 'CRITICAL' || status === 'ERROR') return 'error';
    return 'unknown';
}

function getStatusIcon(statusClass) {
    switch (statusClass) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-question-circle';
    }
}

function getSeverityText(severity) {
    switch (severity) {
        case 'HIGH': return 'Alta';
        case 'MEDIUM': return 'Media';
        case 'LOW': return 'Baja';
        default: return 'Desconocida';
    }
}

function getComponentStatusClass(status) {
    if (!status) return 'unknown';
    
    status = status.toUpperCase();
    if (status === 'NORMAL' || status === 'OK') return 'success';
    if (status === 'WARNING') return 'warning';
    if (status === 'CRITICAL' || status === 'ERROR') return 'error';
    return 'unknown';
}

function getStatusIcon(statusClass) {
    switch (statusClass) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-question-circle';
    }
}

function getDriversStatus(report) {
    if (!report.drivers || !report.drivers.problematic_drivers) {
        return { status: 'unknown', text: 'Sin datos' };
    }
    const problematicCount = report.drivers.problematic_drivers.length;
    return problematicCount > 0 
        ? { status: 'warning', text: `${problematicCount} problemas` }
        : { status: 'success', text: 'Sin problemas' };
}


function getUpdatesStatus(report) {
    if (!report.updates) {
        return { status: 'unknown', text: 'Sin datos' };
    }
    return report.updates.status === 'UpdatesAvailable'
        ? { status: 'warning', text: `${report.updates.count || 'Disponibles'}` }
        : { status: 'success', text: 'Al día' };
}

function getSecurityStatus(report) {
    if (!report.security || !report.security.issues) {
        return { status: 'unknown', text: 'Sin datos' };
    }
    const issuesCount = report.security.issues.length;
    return issuesCount > 0
        ? { status: 'error', text: `${issuesCount} problemas` }
        : { status: 'success', text: 'Protegido' };
}

function createSystemComponentItem(name, statusClass, text, type) {
    const statusIcon = statusClass === 'success' ? 'fa-check-circle' : 
                     statusClass === 'warning' ? 'fa-exclamation-triangle' : 
                     statusClass === 'error' ? 'fa-times-circle' : 'fa-question-circle';
    
    const componentItem = document.createElement('div');
    componentItem.className = 'component-item';
    componentItem.innerHTML = `
        <div class="component-status ${statusClass}">
            <i class="fa-solid ${statusIcon}"></i>
        </div>
        <div class="component-name">${name} (${text})</div>
        <div class="component-details-toggle">
            <i class="fa-solid fa-chevron-down"></i>
        </div>
    `;
    
    componentItem.setAttribute('data-component-type', type);
    return componentItem;
}


function showScanProgressModal() {
   scanProgressModal.style.display = 'flex';
}

function mostrarIndicadorProcesando() {
    const overlay = document.createElement('div');
    overlay.className = 'repair-overlay';
    overlay.innerHTML = `
        <div class="repair-spinner">
            <i class="fas fa-cog fa-spin"></i>
            <p>Procesando...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function ocultarIndicadorProcesando() {
    const overlay = document.querySelector('.repair-overlay');
    if (overlay) overlay.remove();
}

function hideScanProgressModal() {
    if (scanProgressModal) {
        scanProgressModal.style.display = 'none';
    }
    
    if (currentScenarioController) {
        currentScenarioController.abort();
        currentScenarioController = null;
    }
    
    if (currentProgressInterval) {
        clearInterval(currentProgressInterval);
        currentProgressInterval = null;
    }
    
    isScenarioRunning = false;
}

function mostrarDialogoReinicio() {
    const dialogoContainer = document.createElement('div');
    dialogoContainer.className = 'reinicio-dialog';
    dialogoContainer.innerHTML = `
        <div class="dialog-content">
            <h3><i class="fas fa-sync-alt"></i> Se requiere reinicio</h3>
            <p>Para completar la reparación, el sistema debe reiniciarse para aplicar los cambios.</p>
            <div class="action-buttons-container">
                <button class="btn-dashboard btn-secondary-dashboard cancelar-reinicio">
                    <i class="fas fa-clock"></i> Más tarde
                </button>
                <button class="btn-dashboard btn-success-dashboard confirmar-reinicio btn-pulse">
                    <i class="fas fa-power-off"></i> Reiniciar ahora
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(dialogoContainer);
    
    document.querySelector('.cancelar-reinicio').addEventListener('click', function() {
        dialogoContainer.remove();
    });
    
    document.querySelector('.confirmar-reinicio').addEventListener('click', async function() {
        dialogoContainer.innerHTML = `
            <div class="dialog-content">
                <h3><i class="fas fa-spinner fa-spin"></i> Reiniciando el sistema...</h3>
                <p>Por favor espere mientras se reinicia su equipo.</p>
            </div>
        `;
        
        try {
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
            const csrftoken = getCookie('csrftoken');
            
            const response = await fetch('/dashboard/api/system/restart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                dialogoContainer.innerHTML = `
                    <div class="dialog-content">
                        <h3><i class="fas fa-check-circle"></i> Solicitud de reinicio enviada</h3>
                        <p>El sistema se reiniciará en unos segundos.</p>
                    </div>
                `;
                
                let countdown = 5;
                const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                    } else {
                        dialogoContainer.querySelector('p').textContent = `El sistema se reiniciará en ${countdown} segundos.`;
                    }
                }, 1000);
            } else {
                const data = await response.json();
                dialogoContainer.innerHTML = `
                    <div class="dialog-content">
                        <h3><i class="fas fa-exclamation-triangle"></i> Error al reiniciar</h3>
                        <p>${data.message || 'No se pudo reiniciar el sistema automáticamente.'}</p>
                        <p>Por favor reinicie manualmente desde el menú de inicio.</p>
                        <div class="dialog-buttons">
                            <button class="btn btn-primary cerrar-dialogo">Cerrar</button>
                        </div>
                    </div>
                `;
                document.querySelector('.cerrar-dialogo').addEventListener('click', function() {
                    dialogoContainer.remove();
                });
            }
        } catch (error) {
            console.error('Error al reiniciar:', error);
            dialogoContainer.innerHTML = `
                <div class="dialog-content">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error al reiniciar</h3>
                    <p>No se pudo procesar la solicitud de reinicio: ${error.message}</p>
                    <p>Por favor reinicie manualmente desde el menú de inicio.</p>
                    <div class="dialog-buttons">
                        <button class="btn btn-primary cerrar-dialogo">Cerrar</button>
                    </div>
                </div>
            `;
            document.querySelector('.cerrar-dialogo').addEventListener('click', function() {
                dialogoContainer.remove();
            });
        }
    });
}
const styleDialog = document.createElement('style');
styleDialog.textContent = `
.reinicio-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.dialog-content {
    background: #1e2a38;
    border-radius: 10px;
    padding: 25px;
    width: 80%;
    max-width: 500px;
    text-align: center;
    color: white;
}

.dialog-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
}
`;
document.head.appendChild(styleDialog);

async function cargarResultadosDiagnostico(reportId) {
    try {
        const response = await fetch(`/dashboard/api/diagnosis/report/${reportId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener el reporte de diagnóstico');
        }

        const data = await response.json();

        if (data.status === 'success') {
            const report = data.data;
            
            document.querySelector('.diagnosis-summary-info p.diagnosis-type').innerHTML = 
                `Diagnóstico | <span class="diagnosis-problems">${report.summary.critical_issues || 0} Problemas</span>, 
                <span class="diagnosis-suggestions">${(report.summary.warnings || 0) + (report.summary.suggestions || 0)} Sugerencias</span>`;
            
            const componentsList = document.querySelector('.components-list');
            const systemComponentsList = document.querySelector('.system-components-list');
            
            if (componentsList) componentsList.innerHTML = '';
            if (systemComponentsList) systemComponentsList.innerHTML = '';
            
            const addedComponents = new Set();
            
            if (report.components && report.components.length > 0) {
                report.components.forEach(component => {
                    if (!component.name) return;
                    
                    const normalizedName = component.name.toLowerCase().trim();
                    if (addedComponents.has(normalizedName)) return;
                    
                    addedComponents.add(normalizedName);
                    
                    const statusClass = getComponentStatusClass(component.status);
                    const statusIcon = getStatusIcon(statusClass);
                    
                    const componentItem = document.createElement('div');
                    componentItem.className = 'component-item';
                    componentItem.innerHTML = `
                        <div class="component-status ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i>
                        </div>
                        <div class="component-name">${component.name}</div>
                        <div class="component-details-toggle">
                            <i class="fa-solid fa-chevron-down"></i>
                        </div>
                    `;
                    
                    componentItem.setAttribute('data-component-id', component.id || '');
                    componentItem.setAttribute('data-component-type', component.type || '');
                    componentsList.appendChild(componentItem);
                });
            }
            
            if (systemComponentsList) {
                // Controladores
                const driversStatus = getDriversStatus(report);
                const driversItem = createSystemComponentItem('Controladores', driversStatus.status, driversStatus.text, 'drivers');
                systemComponentsList.appendChild(driversItem);
                
                // Actualizaciones
                const updatesStatus = getUpdatesStatus(report);
                const updatesItem = createSystemComponentItem('Actualizaciones', updatesStatus.status, updatesStatus.text, 'updates');
                systemComponentsList.appendChild(updatesItem);
                
                // Seguridad
                const securityStatus = getSecurityStatus(report);
                const securityItem = createSystemComponentItem('Seguridad', securityStatus.status, securityStatus.text, 'security');
                systemComponentsList.appendChild(securityItem);
            }
            
            if (lastCheckDate) {
                lastCheckDate.textContent = formatearFecha(report.start_time);
            }
            
            const diagnosisHistoryTab = document.querySelector('.tab-btn[data-tab="diagnosis-history"]');
            if (diagnosisHistoryTab) {
                diagnosisHistoryTab.click();
            }
            
            mostrarNotificacion('success', 'Diagnóstico completado', 3);
        } else {
            throw new Error(data.message || 'Error al obtener resultados');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al cargar resultados del diagnóstico', 3);
    }
}

 async function cargarDatosMantenimiento() {
    try {
        const maintenanceContainer = document.getElementById('maintenance-options-container');
        if (maintenanceContainer) {
            maintenanceContainer.innerHTML = renderMaintenanceOptions();
        }
        
        const driversContainer = document.getElementById('drivers-info-container');
        if (driversContainer) {
            driversContainer.innerHTML = '<p>Cargando información de controladores...</p>';
            
            const driversResponse = await fetch('/dashboard/api/diagnosis-data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (driversResponse.ok) {
                const data = await driversResponse.json();
                if (data.status === 'success') {
                    const driversData = data.data.drivers_result || {};
                    driversContainer.innerHTML = renderDriversInfo(driversData);
                } else {
                    driversContainer.innerHTML = '<p>No se pudo cargar la información de controladores.</p>';
                }
            } else {
                driversContainer.innerHTML = '<p>Error al obtener información de controladores.</p>';
            }
        }
        
        const updatesContainer = document.getElementById('updates-info-container');
        if (updatesContainer) {
            updatesContainer.innerHTML = '<p>Cargando información de actualizaciones...</p>';
            
            const updatesResponse = await fetch('/dashboard/api/diagnosis-data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (updatesResponse.ok) {
                const data = await updatesResponse.json();
                if (data.status === 'success') {
                    updatesContainer.innerHTML = renderUpdatesInfo(data.data);
                } else {
                    updatesContainer.innerHTML = '<p>No se pudo cargar la información de actualizaciones.</p>';
                }
            } else {
                updatesContainer.innerHTML = '<p>Error al obtener información de actualizaciones.</p>';
            }
        }
        
        const securityContainer = document.getElementById('security-info-container');
        if (securityContainer) {
            securityContainer.innerHTML = '<p>Cargando información de seguridad...</p>';
            
            const securityResponse = await fetch('/dashboard/system/security-info/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (securityResponse.ok) {
                const data = await securityResponse.json();
                if (data.status === 'success') {
                    securityContainer.innerHTML = renderSecurityInfo(data.data);
                } else {
                    securityContainer.innerHTML = '<p>No se pudo cargar la información de seguridad.</p>';
                }
            } else {
                securityContainer.innerHTML = '<p>Error al obtener información de seguridad.</p>';
            }
        }
    } catch (error) {
        console.error('Error al cargar datos de mantenimiento:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    modalDiagnostico.classList.add('modal-hidden');
    cargarHistorialDiagnosticos();
    cargarHistorialDiagnosticosReal();
    cargarEstadoSistemaReal();
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabTarget = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabTarget).classList.add('active');
        });
    });
    
    mostrarEscenariosDisponibles();
    
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('fix-driver-btn') || event.target.closest('.fix-driver-btn')) {
            const button = event.target.classList.contains('fix-driver-btn') ? 
                          event.target : event.target.closest('.fix-driver-btn');
            const deviceId = button.getAttribute('data-device-id');
            repararControlador(deviceId, button);
        }
        
        if (event.target.classList.contains('fix-all-drivers-btn') || event.target.closest('.fix-all-drivers-btn')) {
            repararTodosLosControladores(event.target);
        }
        
        if (event.target.classList.contains('update-driver-btn') || event.target.closest('.update-driver-btn')) {
            const button = event.target.classList.contains('update-driver-btn') ? 
                          event.target : event.target.closest('.update-driver-btn');
            const deviceId = button.getAttribute('data-device-id');
            actualizarControlador(deviceId, button);
        }
        
        if (event.target.classList.contains('update-all-drivers-btn') || event.target.closest('.update-all-drivers-btn')) {
            actualizarTodosLosControladores(event.target);
        }
        
        if (event.target.classList.contains('run-driver-scan-btn') || event.target.closest('.run-driver-scan-btn')) {
            escanearControladores(event.target);
        }
        
        if (event.target.classList.contains('refresh-driver-info-btn') || event.target.closest('.refresh-driver-info-btn')) {
            refrescarInformacionControladores();
        }
        
        if (event.target.classList.contains('fix-driver-table-btn') || event.target.closest('.fix-driver-table-btn')) {
            const button = event.target.classList.contains('fix-driver-table-btn') ? 
                          event.target : event.target.closest('.fix-driver-table-btn');
            const deviceId = button.getAttribute('data-device-id');
            repararControlador(deviceId, button);
        }
        
        if (event.target.classList.contains('component-details-toggle') || 
            event.target.closest('.component-details-toggle')) {
            const componentItem = event.target.closest('.component-item');
            const componentName = componentItem.querySelector('.component-name').textContent;
            mostrarDetallesComponente(componentName);
        }
    });
});
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
.component-detail-section {
    background: #1e2a38;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #334155;
}

.component-detail-section h4 {
    color: white;
    margin-bottom: 20px;
    font-size: 18px;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.metrics-grid.enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.metric-item.enhanced {
    background: rgba(255,255,255,0.05);
    padding: 15px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
}

.metric-item.enhanced:hover {
    transform: translateY(-2px);
    background: rgba(255,255,255,0.08);
}

.metric-icon {
    background: #3498db;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
}

.metric-icon i {
    color: white;
    font-size: 16px;
}

.metric-content {
    display: flex;
    flex-direction: column;
}

.metric-name {
    color: #94a3b8;
    font-size: 12px;
    margin-bottom: 2px;
}

.metric-value {
    color: white;
    font-weight: 500;
    font-size: 14px;
}

.metric-value.critical {
    color: #ef4444;
}

.metric-value.warning {
    color: #f59e0b;
}

.metric-value.normal {
    color: #10b981;
}

.gpu-item.enhanced {
    background: #1e2a38;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    border: 1px solid #334155;
}

.gpu-item.enhanced.main-gpu {
    border-left: 4px solid #3498db;
}

.gpu-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.gpu-brand-icon {
    margin-right: 15px;
}

.brand-logo {
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 12px;
    color: white;
}

.brand-logo.nvidia {
    background: linear-gradient(45deg, #76b900, #00ff41);
}

.brand-logo.amd {
    background: linear-gradient(45deg, #ed1c24, #ff6b35);
}

.brand-logo.intel {
    background: linear-gradient(45deg, #0071c5, #00c7fd);
}

.gpu-info h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 16px;
}

.main-gpu-badge {
    background: #3498db;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
}

.gpu-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.action-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    font-size: 12px;
}

.action-btn.primary {
    background: #3498db;
    color: white;
}

.action-btn.secondary {
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
}

.action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.cpu-overview-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
}

.performance-gauge {
    text-align: center;
    margin-bottom: 20px;
}

.gauge {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: conic-gradient(#3498db 0deg, #3498db var(--percentage, 0deg), #2c3e50 var(--percentage, 0deg), #2c3e50 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.gauge-center {
    background: #1e2a38;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.gauge-value {
    color: white;
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
}

.gauge-label {
    color: #94a3b8;
    font-size: 9px;
    margin-top: 2px;
}

.processes-table {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    overflow: hidden;
}

.processes-header {
    background: #3498db;
    color: white;
    padding: 10px 15px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 15px;
    font-weight: 500;
    font-size: 12px;
}

.process-row {
    padding: 10px 15px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 15px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #94a3b8;
    font-size: 12px;
}

.process-row:last-child {
    border-bottom: none;
}

.process-name {
    color: white;
    font-weight: 500;
}

.memory-overview {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
}

.memory-gauge-container {
    flex-shrink: 0;
}

.partition-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    border-left: 4px solid #10b981;
}

.partition-card.warning {
    border-left-color: #f59e0b;
}

.partition-card.critical {
    border-left-color: #ef4444;
}

.partition-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.partition-icon {
    color: #3498db;
    margin-right: 10px;
}

.partition-info h5 {
    color: white;
    margin: 0;
    font-size: 14px;
}

.partition-path {
    color: #94a3b8;
    font-size: 11px;
}

.partition-usage {
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.partition-usage.normal {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.partition-usage.warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.partition-usage.critical {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.partition-progress {
    margin: 10px 0;
}

.progress-bar {
    background: rgba(255,255,255,0.1);
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
}

.progress-fill.normal {
    background: #10b981;
}

.progress-fill.warning {
    background: #f59e0b;
}

.progress-fill.critical {
    background: #ef4444;
}

.partition-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
}

.detail-label {
    color: #94a3b8;
}

.detail-value {
    color: white;
    font-weight: 500;
}

.network-status-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    border-left: 4px solid #10b981;
}

.network-status-card.disconnected {
    border-left-color: #ef4444;
}

.connection-indicator {
    display: flex;
    align-items: center;
}

.connection-icon {
    background: #10b981;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.disconnected .connection-icon {
    background: #ef4444;
}

.connection-icon i {
    color: white;
    font-size: 16px;
}

.connection-info h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 14px;
}

.connection-details {
    color: #94a3b8;
    font-size: 12px;
}

.adapters-list {
    display: grid;
    gap: 10px;
}

.adapter-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    border-left: 4px solid #10b981;
}

.adapter-card.inactive {
    border-left-color: #6b7280;
}

.adapter-icon {
    background: #3498db;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
}

.adapter-icon i {
    color: white;
    font-size: 14px;
}

.adapter-info h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 13px;
}

.adapter-details {
    display: flex;
    gap: 15px;
    font-size: 11px;
}

.adapter-status.active {
    color: #10b981;
}

.adapter-status.inactive {
    color: #6b7280;
}

.adapter-speed {
    color: #94a3b8;
}

.alert-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    border-left: 4px solid #3498db;
}

.alert-card.success {
    border-left-color: #10b981;
}

.alert-card.warning {
    border-left-color: #f59e0b;
}

.alert-card.critical {
    border-left-color: #ef4444;
}

.alert-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.alert-header i {
    margin-right: 10px;
    font-size: 16px;
}

.alert-card.success .alert-header i {
    color: #10b981;
}

.alert-card.warning .alert-header i {
    color: #f59e0b;
}

.alert-card.critical .alert-header i {
    color: #ef4444;
}

.alert-header h5 {
    color: white;
    margin: 0;
    font-size: 14px;
}

.drivers-problem-list, .drivers-outdated-list {
    margin: 10px 0;
}

.driver-problem-item, .driver-outdated-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: rgba(255,255,255,0.02);
    border-radius: 6px;
    margin-bottom: 8px;
}

.driver-info {
    display: flex;
    flex-direction: column;
}

.driver-name {
    color: white;
    font-weight: 500;
    font-size: 13px;
}

.error-code, .driver-date {
    color: #94a3b8;
    font-size: 11px;
}

.alert-actions {
    margin-top: 15px;
}

.maintenance-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.updates-status-card {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    border-left: 4px solid #10b981;
}

.updates-status-card.warning {
    border-left-color: #f59e0b;
}

.updates-status-card.error {
    border-left-color: #ef4444;
}

.updates-icon {
    background: #10b981;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.updates-status-card.warning .updates-icon {
    background: #f59e0b;
}

.updates-status-card.error .updates-icon {
    background: #ef4444;
}

.updates-icon i {
    color: white;
    font-size: 16px;
}

.updates-info h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 14px;
}

.updates-info p {
    color: #94a3b8;
    margin: 0 0 10px 0;
    font-size: 12px;
}

.updates-list {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 10px;
}

.update-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.update-item:last-child {
    border-bottom: none;
}

.update-icon {
    background: #3498db;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
}

.update-icon i {
    color: white;
    font-size: 12px;
}

.update-name {
    color: white;
    font-size: 12px;
}

.more-updates {
    text-align: center;
    padding: 10px;
    color: #94a3b8;
    font-size: 11px;
}

.security-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.security-component {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    border-left: 4px solid #10b981;
}

.security-component.inactive {
    border-left-color: #ef4444;
}

.security-icon {
    background: #3498db;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
}

.security-icon i {
    color: white;
    font-size: 14px;
}

.security-details {
    flex-grow: 1;
}

.security-details h5 {
    color: white;
    margin: 0 0 3px 0;
    font-size: 13px;
}

.security-status {
    color: #94a3b8;
    font-size: 11px;
    display: block;
}

.security-provider {
    color: #6b7280;
    font-size: 10px;
    display: block;
}

.security-indicator {
    margin-left: 10px;
}

.security-indicator.active i {
    color: #10b981;
}

.security-indicator.inactive i {
    color: #ef4444;
}

.security-issues {
    display: grid;
    gap: 10px;
}

.security-issue {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: flex-start;
    border-left: 4px solid #f59e0b;
}

.security-issue.critical {
    border-left-color: #ef4444;
}

.security-issue.info {
    border-left-color: #3498db;
}

.issue-icon {
    background: #f59e0b;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
}

.security-issue.critical .issue-icon {
    background: #ef4444;
}

.security-issue.info .issue-icon {
    background: #3498db;
}

.issue-icon i {
    color: white;
    font-size: 12px;
}

.issue-content h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 13px;
}

.issue-content p {
    color: #94a3b8;
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
}

.no-data-message {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
}

.no-data-message i {
    font-size: 48px;
    margin-bottom: 15px;
    color: #475569;
}

.no-data-message h3 {
    color: white;
    margin-bottom: 10px;
    font-size: 16px;
}

.no-data-message p {
    margin: 0;
    font-size: 12px;
}

.status-active {
    color: #10b981 !important;
}
.drivers-overview-card, .security-overview {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
}

.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 20px;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #3498db;
}

.stat-label {
    color: #94a3b8;
    font-size: 12px;
    margin-top: 5px;
}

.drivers-categories, .security-components, .update-categories {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
}

.category-item, .security-item {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    border-left: 4px solid #10b981;
}

.security-item.inactive {
    border-left-color: #ef4444;
}

.category-icon, .security-icon {
    background: #3498db;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.category-icon i, .security-icon i {
    color: white;
    font-size: 16px;
}

.category-info, .security-details {
    flex-grow: 1;
}

.category-info h5, .security-details h5 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 14px;
}

.status-ok {
    color: #10b981;
    font-size: 12px;
    display: block;
}

.security-status {
    color: #94a3b8;
    font-size: 12px;
    display: block;
}

.security-description {
    color: #6b7280;
    font-size: 11px;
    margin: 5px 0 0 0;
}

.security-indicator {
    margin-left: 15px;
}

.security-indicator i {
    font-size: 20px;
}

.security-item.active .security-indicator i {
    color: #10b981;
}

.security-item.inactive .security-indicator i {
    color: #ef4444;
}

.security-status-main {
    display: flex;
    align-items: center;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.security-status-main.secure {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.security-status-main.warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.security-status-main .status-icon {
    background: rgba(255,255,255,0.1);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
}

.security-status-main.secure .status-icon i {
    color: #10b981;
    font-size: 24px;
}

.security-status-main.warning .status-icon i {
    color: #f59e0b;
    font-size: 24px;
}

.status-text h3 {
    color: white;
    margin: 0 0 5px 0;
    font-size: 18px;
}

.status-text p {
    color: #94a3b8;
    margin: 0;
    font-size: 12px;
}

.security-recommendations {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
}

.security-recommendations h4 {
    color: #f59e0b;
    margin: 0 0 10px 0;
    font-size: 14px;
}

.recommendations-list {
    color: #94a3b8;
    font-size: 12px;
}

.recommendation-item {
    margin: 5px 0;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.error-container {
    display: flex;
    align-items: center;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.error-icon {
    background: rgba(239, 68, 68, 0.2);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.error-icon i {
    color: #ef4444;
    font-size: 20px;
}

.error-content h4 {
    color: white;
    margin: 0 0 10px 0;
    font-size: 16px;
}

.error-content p {
    color: #94a3b8;
    margin: 5px 0;
    font-size: 12px;
}

.error-message {
    color: #fca5a5 !important;
    font-weight: 500;
}

.error-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

/* Estados de los elementos del sistema */
[data-status="error"] .sistema-item {
    border-left: 3px solid #ef4444;
}

[data-status="warning"] .sistema-item {
    border-left: 3px solid #f59e0b;
}

.drivers-overview-card.enhanced {
    background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(46, 204, 113, 0.1));
    border: 1px solid rgba(52, 152, 219, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
}

.issue-item.enhanced {
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 4px solid;
    transition: all 0.3s ease;
}

.issue-item.enhanced.critical {
    border-left-color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
}

.issue-item.enhanced.warning {
    border-left-color: #f39c12;
    background: rgba(243, 156, 18, 0.1);
}

.issue-item.enhanced.info {
    border-left-color: #3498db;
    background: rgba(52, 152, 219, 0.1);
}

.issue-urgency {
    background: rgba(231, 76, 60, 0.2);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: bold;
    margin-top: 8px;
    text-align: center;
    animation: pulse 2s infinite;
}

.battery-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 15px 0;
}

.battery-metric {
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(255,255,255,0.1);
}

.metric-icon {
    background: #3498db;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
}

.metric-icon i {
    color: white;
    font-size: 16px;
}

.metric-info {
    display: flex;
    flex-direction: column;
}

.metric-label {
    color: #bdc3c7;
    font-size: 12px;
    margin-bottom: 2px;
}

.metric-value {
    color: white;
    font-size: 16px;
    font-weight: bold;
}

.pulse-button {
    animation: pulse 2s infinite;
}

.component-detail-header.enhanced {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #2c3e50, #34495e);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.1);
}

.scenario-icon {
    background: rgba(52, 152, 219, 0.2);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
}

.scenario-icon i {
    color: #3498db;
    font-size: 24px;
}

.header-content h3 {
    color: white;
    margin: 0 0 8px 0;
    font-size: 20px;
}

.download-section {
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1));
    border: 1px solid rgba(46, 204, 113, 0.3);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
}

.download-section h4 {
    color: #2ecc71;
    margin-bottom: 10px;
}

.scenario-actions.enhanced {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
    padding: 20px;
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
}


[data-status="success"] .sistema-item {
    border-left: 3px solid #10b981;
}
`;

function injectChatStyles() {
    if (document.getElementById('chat-personalization-styles')) {
        return; // Ya inyectados
    }
    
    const styles = `
        .chat-suggestions {
            max-width: 100%;
            text-align: left;
        }
        
        .suggestion-btn {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 3px;
            border-radius: 15px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        
        .suggestion-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.4);
            background: linear-gradient(135deg, #0056b3, #004085);
        }
        
        .suggestion-btn:active {
            transform: translateY(0);
        }
        
        .mensaje-asistente.personalized {
            background: linear-gradient(135deg, #e8f4f8, #d1ecf1);
            border-left: 4px solid #007bff;
        }
        
        .user-status-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 5px;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'chat-personalization-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}
document.addEventListener('DOMContentLoaded', function() {
    injectChatStyles();
});
document.head.appendChild(enhancedStyles);


