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
const scenarioButtons = document.querySelectorAll('.scenario-button');
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



scenarioButtons.forEach((button, index) => {
   button.addEventListener('click', function() {
       const scenarioTitle = this.parentElement.querySelector('h4').textContent;
       const scenarioId = index + 1;
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
        showScanProgressModal();
        currentComponentScan.textContent = `Analizando: ${scenarioTitle}`;
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        scanDetailsText.textContent = "Preparando análisis de escenario...";
        
        let progressSpeed;
        let progressCap;
        let animationDuration;
        let stepsMessages = [];
        
        if (scenarioTitle.includes("Pantalla azul")) {
            progressSpeed = 1;
            progressCap = 85;
            animationDuration = 500;
            stepsMessages = [
                { threshold: 10, message: "Analizando registros de eventos del sistema..." },
                { threshold: 30, message: "Buscando eventos de cierre inesperado..." },
                { threshold: 45, message: "Verificando controladores problemáticos..." },
                { threshold: 60, message: "Analizando registros de memoria..." },
                { threshold: 75, message: "Compilando resultados de diagnóstico..." }
            ];
        } else if (scenarioTitle.includes("batería")) {
            progressSpeed = 1;
            progressCap = 85;
            animationDuration = 500;
            stepsMessages = [
                { threshold: 10, message: "Analizando estado de la batería..." },
                { threshold: 30, message: "Verificando ciclos de carga..." },
                { threshold: 50, message: "Generando informe detallado..." },
                { threshold: 70, message: "Analizando aplicaciones de alto consumo..." },
                { threshold: 80, message: "Compilando recomendaciones..." }
            ];
        } else if (scenarioTitle.includes("Sistema lento")) {
            progressSpeed = 3;
            progressCap = 92;
            animationDuration = 300;
            stepsMessages = [
                { threshold: 15, message: "Analizando uso de CPU..." },
                { threshold: 35, message: "Verificando consumo de RAM..." },
                { threshold: 55, message: "Analizando procesos con alto consumo..." },
                { threshold: 75, message: "Verificando programas de inicio..." }
            ];
        } else if (scenarioTitle.includes("conectividad")) {
            progressSpeed = 2;
            progressCap = 90;
            animationDuration = 400;
            stepsMessages = [
                { threshold: 20, message: "Verificando conexión a Internet..." },
                { threshold: 40, message: "Analizando adaptadores de red..." },
                { threshold: 60, message: "Comprobando configuración DNS..." },
                { threshold: 80, message: "Analizando rendimiento de red..." }
            ];
        } else {
            progressSpeed = 2;
            progressCap = 88;
            animationDuration = 400;
            stepsMessages = [
                { threshold: 25, message: "Analizando componentes del sistema..." },
                { threshold: 50, message: "Verificando configuración..." },
                { threshold: 75, message: "Compilando resultados..." }
            ];
        }
        
        let simulatedProgress = 0;
        let currentMessageIndex = 0;
        
        const progressInterval = setInterval(() => {
            simulatedProgress += progressSpeed;
            if (simulatedProgress > progressCap) simulatedProgress = progressCap;
            
            scanPercentage.textContent = simulatedProgress + "%";
            scanProgressBar.querySelector('span').style.width = simulatedProgress + "%";
            
            if (currentMessageIndex < stepsMessages.length && 
                simulatedProgress >= stepsMessages[currentMessageIndex].threshold) {
                currentComponentScan.textContent = stepsMessages[currentMessageIndex].message;
                currentMessageIndex++;
            }
            
            if (simulatedProgress >= progressCap - 5) {
                scanProgressBar.querySelector('span').classList.add('progress-pulse');
            }
            
        }, animationDuration);
        
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
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('TIMEOUT_SIGUE_PROCESANDO'));
            }, 120000); 
        });
        
        const response = await Promise.race([
            fetch(`/dashboard/api/diagnosis/scenario/${scenarioId}/`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            timeoutPromise
        ]);
 
        clearInterval(progressInterval);
        scanProgressBar.querySelector('span').classList.remove('progress-pulse');
        
        if (!response.ok) {
            throw new Error('Error al iniciar el escenario');
        }
 
        const data = await response.json();
 
        if (data.status === 'success') {
            let finalProgress = simulatedProgress;
            const completeInterval = setInterval(() => {
                finalProgress += 2;
                if (finalProgress >= 100) {
                    finalProgress = 100;
                    clearInterval(completeInterval);
                    currentComponentScan.textContent = "Análisis completado";
                    scanDetailsText.textContent = "Preparando resultados...";
                    
                    setTimeout(async () => {
                        await obtenerResultadoEscenario(data.run_id);
                        hideScanProgressModal();
                    }, 800);
                }
                
                scanPercentage.textContent = finalProgress + "%";
                scanProgressBar.querySelector('span').style.width = finalProgress + "%";
            }, 50);
            
            mostrarNotificacion('success', 'Análisis de escenario completado', 3);
        } else {
            throw new Error(data.message || 'Error al iniciar el escenario');
        }
    } catch (error) {
        console.error('Error:', error);
        
        if (error.message === 'TIMEOUT_SIGUE_PROCESANDO') {
            scanPercentage.textContent = "95%";
            scanProgressBar.querySelector('span').style.width = "95%";
            
            currentComponentScan.textContent = "Compilando resultados de diagnóstico...";
            scanDetailsText.textContent = "Esta operación está tomando más tiempo del habitual pero sigue ejecutándose en segundo plano.";
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'timeout-buttons mt-3 d-flex justify-content-between';
            
            const closeButton = document.createElement('button');
            closeButton.className = 'btn btn-secondary';
            closeButton.textContent = 'Cerrar y continuar en segundo plano';
            closeButton.onclick = function() {
                hideScanProgressModal();
                mostrarNotificacion('info', 'El diagnóstico continúa en segundo plano. Podrás ver los resultados en el historial cuando termine.', 5);
            };
            
            const checkResultsButton = document.createElement('button');
            checkResultsButton.className = 'btn btn-primary';
            checkResultsButton.textContent = 'Comprobar resultados';
            checkResultsButton.onclick = async function() {
                try {
                    const response = await fetch('/dashboard/api/diagnosis/latest/', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === 'success' && data.scenario_run_id) {
                            hideScanProgressModal();
                            await obtenerResultadoEscenario(data.scenario_run_id);
                        } else {
                            mostrarNotificacion('info', 'El diagnóstico aún está en proceso. Por favor, espera un momento y vuelve a intentarlo.', 3);
                        }
                    } else {
                        mostrarNotificacion('warning', 'No se pudieron obtener los resultados más recientes. Por favor, verifica en el historial más tarde.', 3);
                    }
                } catch (e) {
                    console.error('Error al comprobar resultados:', e);
                    mostrarNotificacion('error', 'Error al comprobar resultados', 3);
                }
            };
            
            buttonContainer.appendChild(closeButton);
            buttonContainer.appendChild(checkResultsButton);
            
            const modalContent = document.querySelector('.scan-progress-content') || document.querySelector('.modal-content');
            modalContent.appendChild(buttonContainer);
            
            mostrarNotificacion('info', 'El diagnóstico está tardando más de lo habitual, pero continúa en segundo plano.', 5);
        } else {
            mostrarNotificacion('error', 'Error al iniciar el escenario: ' + error.message, 3);
            hideScanProgressModal();
        }
    }
}

// Añadir este CSS para el efecto de pulso
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
           
           if (!escenario.results) {
               escenario.results = { 
                   status: "UNKNOWN", 
                   issues: [],
                   report_available: false
               };
           }
           
           mostrarDetallesEscenario(escenario);
       } else {
           throw new Error(data.message || 'Error al obtener resultados');
       }
   } catch (error) {
       console.error('Error:', error);
       mostrarNotificacion('error', 'Error al cargar resultados del escenario', 3);
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
        document.querySelector('.contentData').style.display = 'none';
        detailedResults.style.display = 'block';
        
        detailedResultsContent.innerHTML = `
            <div class="loading-details">
                <p>Cargando detalles del componente...</p>
            </div>
        `;
        
        // Obtener el elemento del componente que se hizo clic
        const componentItems = document.querySelectorAll('.component-item');
        let componentItem = null;
        let componentType = '';
        let componentId = '';
        
        for (let item of componentItems) {
            const nameElement = item.querySelector('.component-name');
            if (nameElement && nameElement.textContent.includes(componentName)) {
                componentItem = item;
                componentType = item.getAttribute('data-component-type') || '';
                componentId = item.getAttribute('data-component-id') || '';
                break;
            }
        }
        
        // Normalizar el nombre del componente para evitar problemas con texto adicional
        const normalizedName = componentName.split('(')[0].trim();
        
        // Para componentes especiales (controladores, actualizaciones, seguridad)
        if (componentType === 'drivers' || componentType === 'updates' || componentType === 'security') {
            const endpoint = componentType === 'security' ? '/dashboard/system/security-info/' :
                            componentType === 'updates' ? '/dashboard/system/updates-info/' :
                            '/dashboard/api/diagnosis-data/';
            
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    throw new Error(`Error al obtener datos de ${normalizedName}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    let detailsHtml = `
                        <div class="component-detail-header">
                            <h3>${normalizedName}</h3>
                        </div>`;
                    
                    if (componentType === 'drivers') {
                        detailsHtml += renderDriversInfo(data.data?.drivers_result || {});
                    } else if (componentType === 'updates') {
                        detailsHtml += renderUpdatesInfo(data.data || {});
                    } else if (componentType === 'security') {
                        detailsHtml += renderSecurityInfo(data.data || {});
                    }
                    
                    detailedResultsContent.innerHTML = detailsHtml;
                    return;
                }
            } catch (error) {
                console.error(`Error al obtener detalles de ${componentType}:`, error);
                
                // Mensaje de error para el componente específico
                detailedResultsContent.innerHTML = `
                    <div class="component-detail-header">
                        <h3>${normalizedName}</h3>
                    </div>
                    <div class="error-message">
                        <p>No hay datos disponibles sobre ${normalizedName.toLowerCase()} en este momento.</p>
                        <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                    </div>
                `;
                return;
            }
        }
        
        // Para componentes estándar (CPU, RAM, Disco, etc.)
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
                        renderizarDetallesComponente(normalizedName, componentData.data);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error al obtener detalles del componente:", error);
            }
        }
        
        // Si no se pudo obtener datos específicos, intentar con datos generales
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
                    renderizarDetallesComponente(normalizedName, data.data);
                    return;
                }
            }
        } catch (error) {
            console.error("Error al cargar datos generales:", error);
        }
        
        // Si todos los intentos fallan, mostrar mensaje genérico
        detailedResultsContent.innerHTML = `
            <div class="component-detail-header">
                <h3>${normalizedName}</h3>
            </div>
            <div class="component-detail-section">
                <p>No hay detalles disponibles para este componente en este momento.</p>
                <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error general:', error);
        detailedResultsContent.innerHTML = `
            <div class="error-message">
                <p>Error al cargar detalles: ${error.message}</p>
                <button class="retry-button">Reintentar</button>
            </div>
        `;
        
        // Agregar evento al botón de reintentar
        const retryButton = detailedResultsContent.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => mostrarDetallesComponente(componentName));
        }
    }
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
           statusText = 'Advertencia';
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
               <h4>Problemas detectados</h4>
               <div class="issues-list">
       `;
       
       escenario.results.issues.forEach(issue => {
           const severityClass = issue.severity === 'HIGH' ? 'high' : 
                                issue.severity === 'MEDIUM' ? 'medium' : 'low';
           
           const isDriverIssue = issue.description.toLowerCase().includes("controlador") || 
                                issue.description.toLowerCase().includes("dispositivo") ||
                                issue.type === "DRIVER";
           
           issuesHtml += `
               <div class="issue-item ${severityClass}">
                   <div class="issue-header">
                       <span class="issue-severity">${getSeverityText(issue.severity)}</span>
                       <h5 class="issue-title">${issue.description}</h5>
                   </div>
                   <p class="issue-recommendation">${issue.recommendation}</p>
               </div>
           `;
       });
       
       const hasDriverIssues = escenario.results.issues.some(issue => 
           issue.description.toLowerCase().includes("controlador") || 
           issue.description.toLowerCase().includes("dispositivo") ||
           issue.type === "DRIVER"
       );
       
       if (hasDriverIssues) {
           issuesHtml += `
               <div class="fix-all-issues-container mt-3">
                   <button class="btn-dashboard btn-primary-dashboard fix-all-driver-issues-btn">
                       <i class="fas fa-tools"></i> Reparar todos los controladores
                   </button>
               </div>
           `;
       }
       
       issuesHtml += `
               </div>
           </div>
       `;
   }
   
   let downloadButtonHtml = '';
   if (escenario.results.report_available && escenario.diagnosis_id) {
       downloadButtonHtml = `
           <div class="mt-4 text-center battery-report-download">
               <button class="btn-dashboard btn-primary-dashboard">
                   <i class="fa-solid fa-download"></i> Descargar informe completo de batería
               </button>
           </div>
       `;
   }
   
   detailedResultsContent.innerHTML = `
       <div class="component-detail-header">
           <h3>${escenario.scenario}</h3>
           <div class="component-status-badge ${statusClass}">
               ${statusText}
           </div>
       </div>
       <div class="component-detail-section">
           <h4>Recomendaciones</h4>
           <p>${escenario.recommendations || 'No hay recomendaciones específicas para este escenario.'}</p>
       </div>
       ${issuesHtml}
       ${downloadButtonHtml}
       <div class="scenario-timestamp">
           <p>Fecha de análisis: ${formatearFecha(escenario.timestamp)}</p>
       </div>
       
       <div class="scenario-actions mt-4">
           <button class="btn-dashboard btn-info-dashboard run-driver-scan-btn">
               <i class="fas fa-search"></i> Escanear controladores nuevamente
           </button>
           ${escenario.scenario.includes("Error de controlador") ? `
               <button class="btn-dashboard btn-success-dashboard fix-all-scenario-drivers-btn">
                   <i class="fas fa-tools"></i> Solucionar todos los problemas detectados
               </button>
           ` : ''}
       </div>
   `;
   
   const fixAllIssuesButton = detailedResultsContent.querySelector('.fix-all-driver-issues-btn');
   if (fixAllIssuesButton) {
       fixAllIssuesButton.addEventListener('click', function() {
           repararTodosLosControladores(this);
       });
   }
   
   const scanButton = detailedResultsContent.querySelector('.run-driver-scan-btn');
   if (scanButton) {
       scanButton.addEventListener('click', function() {
           escanearControladores(this);
       });
   }
   
   const fixAllScenarioButton = detailedResultsContent.querySelector('.fix-all-scenario-drivers-btn');
   if (fixAllScenarioButton) {
       fixAllScenarioButton.addEventListener('click', function() {
           repararTodosLosControladores(this);
       });
   }
   
   if (escenario.results.report_available && escenario.diagnosis_id) {
       const downloadButton = detailedResultsContent.querySelector('.battery-report-download button');
       if (downloadButton) {
           downloadButton.addEventListener('click', function() {
               window.open(`/dashboard/api/diagnosis/${escenario.diagnosis_id}/file/BATTERY_REPORT/`, '_blank');
           });
       }
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
                    <span class="metric-name">Temperatura:</span>
                    <span class="metric-value">${cpuTemp}</span>
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
    let html = `
        <div class="component-detail-section">
            <h4>Detalles del procesador</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-name">Uso:</span>
                    <span class="metric-value">${usage}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Temperatura:</span>
                    <span class="metric-value">${temp || 'No disponible'}</span>
                </div>
            </div>
        </div>`;
        
    if (processes && processes.length > 0) {
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
                        
        processes.forEach(process => {
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

 function renderRAMDetails(ramData) {
    if (!ramData) return '<p>No hay datos disponibles sobre la memoria RAM.</p>';
    
    let html = `
        <div class="component-detail-section">
            <h4>Detalles de la memoria</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-name">Total:</span>
                    <span class="metric-value">${ramData.total || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">En uso:</span>
                    <span class="metric-value">${ramData.used || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Disponible:</span>
                    <span class="metric-value">${ramData.available || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Porcentaje de uso:</span>
                    <span class="metric-value">${ramData.percent || 'No disponible'}</span>
                </div>
            </div>
        </div>
        
        <div class="component-detail-section">
            <h4>Memoria virtual (Swap)</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-name">Total:</span>
                    <span class="metric-value">${ramData.swap_total || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">En uso:</span>
                    <span class="metric-value">${ramData.swap_used || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Porcentaje:</span>
                    <span class="metric-value">${ramData.swap_percent || 'No disponible'}</span>
                </div>
            </div>
        </div>`;
        
    if (ramData.memory_intensive_processes && ramData.memory_intensive_processes.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Procesos con mayor consumo de memoria</h4>
                <div class="process-list">
                    <table class="process-table">
                        <thead>
                            <tr>
                                <th>Proceso</th>
                                <th>Memoria</th>
                            </tr>
                        </thead>
                        <tbody>`;
                        
        ramData.memory_intensive_processes.forEach(process => {
            html += `
                <tr>
                    <td>${process.name || 'Desconocido'}</td>
                    <td>${process.memory_percent || 'N/A'}</td>
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

function renderDiskDetails(diskData) {
    if (!diskData || !diskData.partitions) return '<p>No hay datos disponibles sobre el almacenamiento.</p>';
    
    let html = `
        <div class="component-detail-section">
            <h4>Particiones de disco</h4>
            <div class="disk-partitions">
                <table class="partition-table">
                    <thead>
                        <tr>
                            <th>Unidad</th>
                            <th>Punto de montaje</th>
                            <th>Total</th>
                            <th>Usado</th>
                            <th>Libre</th>
                            <th>Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>`;
                    
    diskData.partitions.forEach(partition => {
        html += `
            <tr>
                <td>${partition.device || 'N/A'}</td>
                <td>${partition.mountpoint || 'N/A'}</td>
                <td>${partition.total || 'N/A'}</td>
                <td>${partition.used || 'N/A'}</td>
                <td>${partition.free || 'N/A'}</td>
                <td>${partition.percent || 'N/A'}</td>
            </tr>`;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>`;
        
    if (diskData.fragmentation) {
        html += `
            <div class="component-detail-section">
                <h4>Fragmentación</h4>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-name">Porcentaje de fragmentación:</span>
                        <span class="metric-value">${diskData.fragmentation.percent || 'No disponible'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-name">Estado:</span>
                        <span class="metric-value">${diskData.fragmentation.status || 'No disponible'}</span>
                    </div>
                </div>
            </div>`;
    }
    
    if (diskData.health) {
        const healthClass = diskData.health.status === 'Critical' ? 'error' : 'success';
        
        html += `
            <div class="component-detail-section">
                <h4>Estado de salud del disco</h4>
                <div class="disk-health ${healthClass}">
                    <span class="health-status">${diskData.health.status || 'No disponible'}</span>
                </div>
            </div>`;
    }
    
    return html;
}

function renderNetworkDetails(networkData) {
    if (!networkData) return '<p>No hay datos disponibles sobre la red.</p>';
    
    let html = `
        <div class="component-detail-section">
            <h4>Estadísticas de red</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-name">Datos enviados:</span>
                    <span class="metric-value">${networkData.bytes_sent || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Datos recibidos:</span>
                    <span class="metric-value">${networkData.bytes_recv || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Paquetes enviados:</span>
                    <span class="metric-value">${networkData.packets_sent || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Paquetes recibidos:</span>
                    <span class="metric-value">${networkData.packets_recv || 'No disponible'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Conexiones activas:</span>
                    <span class="metric-value">${networkData.connections || 'No disponible'}</span>
                </div>
            </div>
        </div>`;
        
    if (networkData.internet_status) {
        const connectClass = networkData.internet_status.connected ? 'success' : 'error';
        
        html += `
            <div class="component-detail-section">
                <h4>Conectividad a Internet</h4>
                <div class="internet-status ${connectClass}">
                    <div class="metric-item">
                        <span class="metric-name">Estado:</span>
                        <span class="metric-value">${networkData.internet_status.status || 'No disponible'}</span>
                    </div>`;
                    
        if (networkData.internet_status.connected) {
            html += `
                    <div class="metric-item">
                        <span class="metric-name">Ping:</span>
                        <span class="metric-value">${networkData.internet_status.ping} ms</span>
                    </div>`;
        }
        
        html += `
                </div>
            </div>`;
    }
    
    if (networkData.wifi_status && networkData.wifi_status.length > 0) {
        html += `
            <div class="component-detail-section">
                <h4>Adaptadores Wi-Fi</h4>
                <div class="wifi-adapters">
                    <table class="wifi-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Estado</th>
                                <th>Velocidad</th>
                            </tr>
                        </thead>
                        <tbody>`;
                        
        networkData.wifi_status.forEach(adapter => {
            const adapterClass = adapter.Status === 'Up' ? 'success' : 'error';
            
            html += `
                <tr class="${adapterClass}">
                    <td>${adapter.Name || 'Desconocido'}</td>
                    <td>${adapter.Status || 'Desconocido'}</td>
                    <td>${adapter.LinkSpeed || 'Desconocido'}</td>
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

function inicializarEstadoSistema() {
    // Buscar el elemento con el encabezado 'Estado del sistema'
    const headers = document.querySelectorAll('h3');
    let estadoSistemaHeader = null;
    
    for (const header of headers) {
        if (header.textContent.trim() === 'Estado del sistema') {
            estadoSistemaHeader = header;
            break;
        }
    }
    
    if (!estadoSistemaHeader) {
        // Intentar con otros niveles de encabezado
        const allHeaders = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .section-title');
        for (const header of allHeaders) {
            if (header.textContent.includes('Estado del sistema')) {
                estadoSistemaHeader = header;
                break;
            }
        }
    }
    
    if (estadoSistemaHeader) {
        // Obtener el contenedor padre
        const container = estadoSistemaHeader.closest('div');
        
        // Comprobar si ya existe contenido (para evitar duplicados)
        if (container && !container.querySelector('.estado-sistema-items')) {
            // Crear el contenedor para el nuevo contenido
            const estadoSistemaItems = document.createElement('div');
            estadoSistemaItems.className = 'estado-sistema-items';
            estadoSistemaItems.style.display = 'grid';
            estadoSistemaItems.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            estadoSistemaItems.style.gap = '15px';
            estadoSistemaItems.style.margin = '15px 0';
            
            // Añadir elementos de estado del sistema que NO sean redundantes con componentes
            estadoSistemaItems.innerHTML = `
                <div style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                    <div style="background-color: #28a745; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-shield-alt" style="color: white;"></i>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">Seguridad</strong>
                        <span>Protección activa</span>
                    </div>
                </div>
                
                <div style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                    <div style="background-color: #17a2b8; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-sync-alt" style="color: white;"></i>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">Actualizaciones</strong>
                        <span>Sistema actualizado</span>
                    </div>
                </div>
                
                <div style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                    <div style="background-color: #fd7e14; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-cogs" style="color: white;"></i>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">Controladores</strong>
                        <span>2 actualizaciones disponibles</span>
                    </div>
                </div>
                
                <div style="background-color: #1e2a38; padding: 15px; border-radius: 8px; display: flex; align-items: center;">
                    <div style="background-color: #6f42c1; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-thermometer-half" style="color: white;"></i>
                    </div>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">Temperatura</strong>
                        <span>CPU: 65°C - Normal</span>
                    </div>
                </div>
            `;
            
            // Insertarlo después del encabezado
            if (estadoSistemaHeader.nextElementSibling) {
                estadoSistemaHeader.parentNode.insertBefore(estadoSistemaItems, estadoSistemaHeader.nextElementSibling);
            } else {
                container.appendChild(estadoSistemaItems);
            }
            
            console.log("Estado del sistema inicializado correctamente");
        } else {
            console.log("El contenido de Estado del sistema ya existe o no se pudo encontrar el contenedor");
        }
    } else {
        console.error("No se pudo encontrar el encabezado 'Estado del sistema'");
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
    if (!gpuInfo || gpuInfo.length === 0) return '<p>No hay datos disponibles sobre la tarjeta gráfica.</p>';
    
    let html = `
        <div class="component-detail-section">
            <h4>Tarjeta(s) gráfica(s)</h4>
            <div class="gpu-list">`;
            
    gpuInfo.forEach(gpu => {
        html += `
            <div class="gpu-item">
                <h5>${gpu.name || 'GPU Desconocida'}</h5>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-name">Memoria:</span>
                        <span class="metric-value">${gpu.memory || 'No disponible'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-name">Controlador:</span>
                        <span class="metric-value">${gpu.driver || 'No disponible'}</span>
                    </div>
                </div>
            </div>`;
    });
    
    html += `
            </div>
        </div>`;
        
    return html;
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
                <div class="error-message">
                    <p>No hay datos disponibles sobre controladores en este momento.</p>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado de los controladores</h4>`;
            
    if (driversData.problematic_drivers && driversData.problematic_drivers.length > 0) {
        html += `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-circle"></i> Controladores con problemas</h5>
                <ul class="driver-problems-list">`;
        
        driversData.problematic_drivers.forEach(driver => {
            html += `
                <li>
                    <strong>${driver.name || 'Dispositivo desconocido'}</strong>
                    <span class="error-code">Código de error: ${driver.error_code || 'Desconocido'}</span>
                    <button class="btn btn-sm btn-primary fix-driver-btn" data-device-id="${driver.DeviceID || ''}">
                        <i class="fas fa-wrench"></i> Reparar
                    </button>
                </li>`;
        });
        
        html += `
                </ul>
                <div class="mt-3">
                    <button class="btn btn-primary fix-all-drivers-btn">
                        <i class="fas fa-tools"></i> Reparar todos los controladores
                    </button>
                </div>
            </div>`;
    } else {
        html += `
            <div class="alert alert-success">
                <h5><i class="fas fa-check-circle"></i> Todos los controladores funcionan correctamente</h5>
                <p>No se detectaron problemas con los controladores de su sistema.</p>
            </div>`;
    }
    
    if (driversData.outdated_drivers && driversData.outdated_drivers.length > 0) {
        html += `
            <div class="alert alert-warning">
                <h5><i class="fas fa-exclamation-triangle"></i> Controladores desactualizados</h5>
                <ul class="driver-outdated-list">`;
        
        driversData.outdated_drivers.forEach(driver => {
            html += `
                <li>
                    <strong>${driver.name || 'Controlador desconocido'}</strong>
                    <span class="driver-date">Fecha: ${driver.date || 'Desconocida'}</span>
                    <button class="btn btn-sm btn-outline-primary update-driver-btn" data-device-id="${driver.DeviceID || ''}">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                </li>`;
        });
        
        html += `
                </ul>
                <div class="mt-3">
                    <button class="btn btn-outline-primary update-all-drivers-btn">
                        <i class="fas fa-sync-alt"></i> Actualizar todos los controladores
                    </button>
                </div>
            </div>`;
    }
    
    if (driversData.drivers && driversData.drivers.length > 0) {
        html += `
            <div class="drivers-list">
                <table class="drivers-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Versión</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        driversData.drivers.slice(0, 10).forEach(driver => {
            const statusClass = driver.status === 'Normal' ? 'success' : 
                              driver.status === 'Desactualizado' ? 'warning' : 'error';
            
            html += `
                <tr>
                    <td>${driver.name || 'Desconocido'}</td>
                    <td>${driver.version || 'N/A'}</td>
                    <td>${driver.date || 'N/A'}</td>
                    <td class="${statusClass}">${driver.status || 'Desconocido'}</td>
                    <td>
                        ${driver.status !== 'Normal' ? 
                          `<button class="btn btn-sm btn-outline-primary fix-driver-table-btn" data-device-id="${driver.DeviceID || ''}">
                           <i class="fas fa-wrench"></i>
                           </button>` : ''}
                    </td>
                </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
                <p class="drivers-count">Mostrando ${Math.min(10, driversData.drivers.length)} de ${driversData.drivers.length} controladores</p>
            </div>`;
    }
    
    html += `
        </div>
        <div class="component-detail-section">
            <h4>Acciones de mantenimiento</h4>
            <div class="driver-actions">
                <button class="btn btn-primary run-driver-scan-btn">
                    <i class="fas fa-search"></i> Escanear controladores
                </button>
                <button class="btn btn-info refresh-driver-info-btn">
                    <i class="fas fa-sync-alt"></i> Actualizar información
                </button>
            </div>
        </div>`;
    
    return html;
}

function renderUpdatesInfo(updatesData) {
    if (!updatesData || Object.keys(updatesData).length === 0) {
        return `
            <div class="component-detail-section">
                <div class="error-message">
                    <p>No hay datos disponibles sobre actualizaciones en este momento.</p>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    const updatesClass = updatesData.status === 'UpToDate' ? 'success' : 
                       updatesData.status === 'UpdatesAvailable' ? 'warning' : 'error';
    
    let html = `
        <div class="component-detail-section">
            <h4>Actualizaciones del sistema</h4>
            <div class="updates-status ${updatesClass}">
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
                    <button class="btn btn-primary install-updates-btn">Instalar actualizaciones</button>`;
    }
    
    html += `
                </div>
            </div>`;
    
    // Lista de actualizaciones disponibles
    if (updatesData.status === 'UpdatesAvailable' && updatesData.updates && updatesData.updates.length > 0) {
        html += `
            <div class="updates-list">
                <h5>Actualizaciones disponibles:</h5>
                <ul>`;
        
        updatesData.updates.forEach(update => {
            html += `
                <li>${update.Title || update.KB || 'Actualización sin nombre'}</li>`;
        });
        
        html += `
                </ul>
            </div>`;
    } else if (updatesData.status === 'UpToDate') {
        html += `
            <div class="updates-message">
                <p>Su sistema está al día con las últimas actualizaciones.</p>
            </div>`;
    }
    
    html += `
        </div>`;
    
    return html;
}

// Añade también esta función para mantenimiento del sistema
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
                        
                        // Mensaje específico para esta fase
                        currentComponentScan.textContent = "Aplicando cambios al sistema...";
                        
                        // Añadir animación de "pulso" a la barra
                        scanProgressBar.querySelector('span').classList.add('progress-pulse');
                        
                        // Tercera fase - progresión lentísima hasta 95%
                        let finalProgress = slowProgress;
                        const finalInterval = setInterval(() => {
                            // Si está en segundo plano, detener estas animaciones
                            if (window.reparacionEnSegundoPlano) {
                                clearInterval(finalInterval);
                                return;
                            }
                            
                            finalProgress += Math.random() * 0.2;
                            if (finalProgress > 95) {
                                finalProgress = 95;
                                clearInterval(finalInterval);
                                
                                // Añadir indicador visual de que aún está procesando
                                let dots = 0;
                                const dotsInterval = setInterval(() => {
                                    // Si está en segundo plano, detener estas animaciones
                                    if (window.reparacionEnSegundoPlano) {
                                        clearInterval(dotsInterval);
                                        return;
                                    }
                                    
                                    dots = (dots + 1) % 4;
                                    const dotsText = '.'.repeat(dots);
                                    currentComponentScan.textContent = `Aplicando cambios al sistema${dotsText}`;
                                    
                                    // Rotar mensajes para mantener interés
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
        
        // Añadir botón para continuar en segundo plano después de 20 segundos
        setTimeout(() => {
            // Solo añadir si el proceso aún está en curso y no está en segundo plano
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
                        // Activar modo segundo plano
                        window.reparacionEnSegundoPlano = true;
                        
                        // Limpiar todos los intervalos de animación
                        clearInterval(window.initialInterval);
                        clearInterval(window.secondInterval);
                        clearInterval(window.finalInterval);
                        clearInterval(window.dotsInterval);
                        
                        // Ocultar el modal
                        hideScanProgressModal();
                        
                        // Crear indicador de proceso en segundo plano
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
                        
                        // Al hacer clic en el indicador, mostrar detalles
                        bgIndicator.addEventListener('click', () => {
                            alert('La reparación de controladores está en proceso. Se notificará cuando termine.');
                        });
                        
                        // Mensaje informativo
                        console.log('Reparación de controladores continúa en segundo plano');
                    });
                }
            }
        }, 20000);
        
        // Realizar la petición HTTP para reparar controladores
        const response = await fetch('/dashboard/api/diagnosis/fix-all-drivers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });
        
        // Limpiar todos los intervalos 
        clearInterval(window.initialInterval);
        clearInterval(window.secondInterval);
        clearInterval(window.finalInterval);
        clearInterval(window.dotsInterval);
        
        const data = await response.json();
        
        // Marcar como completado
        window.reparacionEnProgreso = false;
        
        // Si está en modo segundo plano, mostrar notificación y eliminar indicador
        if (window.reparacionEnSegundoPlano) {
            const bgIndicator = document.getElementById('bg-process-indicator');
            if (bgIndicator) {
                bgIndicator.remove();
            }
            
            // Crear notificación de completado
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
            
            // Configurar botones
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
            
            // Auto-cerrar después de 30 segundos
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.remove();
                }
            }, 30000);
        } else {
            // Quitar la clase de pulso
            scanProgressBar.querySelector('span').classList.remove('progress-pulse');
            
            // Completar animación hasta 100%
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
                        
                        // Mostrar resultados y mensaje de reinicio si es necesario
                        if (data.status === 'success' || data.status === 'partial') {
                            if (data.requires_restart) {
                                mostrarDialogoReinicio();
                            }
                        } else {
                            mostrarMensajeError(data.message || "No se pudieron reparar todos los controladores");
                        }
                        
                        buttonElement.innerHTML = originalText;
                        buttonElement.disabled = false;
                        
                        // Actualizar vista si estamos en un escenario
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
        
        // Limpiar todos los intervalos en caso de error
        clearInterval(window.initialInterval);
        clearInterval(window.secondInterval);
        clearInterval(window.finalInterval);
        clearInterval(window.dotsInterval);
        
        // Eliminar indicador de segundo plano si existe
        const bgIndicator = document.getElementById('bg-process-indicator');
        if (bgIndicator) {
            bgIndicator.remove();
        }
        
        window.reparacionEnProgreso = false;
        
        hideScanProgressModal();
        
        // Mostrar mensaje de error adecuado
        if (!window.reparacionEnSegundoPlano) {
            mostrarMensajeError("Error al reparar controladores: " + error.message);
        } else {
            // Crear notificación de error
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
    // Implementar según necesidades para mostrar resultados detallados
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

// Función para mostrar mensajes de error como alerta en la página
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
    
    // Si estamos en la vista de detalles
    if (detailedResultsContent) {
        const currentContent = detailedResultsContent.innerHTML;
        detailedResultsContent.innerHTML = currentContent + alertHTML;
        
        // Hacer scroll hacia el alerta
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

// Actualizar todos los controladores
async function actualizarTodosLosControladores(buttonElement) {
    try {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Actualizando...`;
        buttonElement.disabled = true;
        
        showScanProgressModal();
        currentComponentScan.textContent = "Buscando actualizaciones...";
        scanPercentage.textContent = "0%";
        scanProgressBar.querySelector('span').style.width = "0%";
        
        // Simulación del progreso
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
            // La operación se ha completado con éxito
            // Podríamos mostrar resultados específicos según la acción
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
                <div class="error-message">
                    <p>No hay datos disponibles sobre la seguridad del sistema en este momento.</p>
                    <p>Para obtener información actualizada, ejecute un nuevo diagnóstico.</p>
                </div>
            </div>`;
    }
    
    // Función para determinar la clase de estado
    const getStatusClass = (enabled) => enabled ? 'success' : 'error';
    
    let html = `
        <div class="component-detail-section">
            <h4>Estado de seguridad</h4>
            <div class="security-grid">`;
            
    // Firewall
    if (securityData.firewall) {
        const firewallClass = getStatusClass(securityData.firewall.enabled);
        html += `
                <div class="security-item ${firewallClass}">
                    <div class="security-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Firewall</h5>
                        <span class="security-status">${securityData.firewall.status || (securityData.firewall.enabled ? 'Activo' : 'Inactivo')}</span>
                    </div>
                </div>`;
    } else {
        html += `
                <div class="security-item unknown">
                    <div class="security-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Firewall</h5>
                        <span class="security-status">Estado desconocido</span>
                    </div>
                </div>`;
    }
    
    // Antivirus
    if (securityData.antivirus) {
        const antivirusClass = getStatusClass(securityData.antivirus.enabled);
        html += `
                <div class="security-item ${antivirusClass}">
                    <div class="security-icon">
                        <i class="fas fa-virus-slash"></i>
                    </div>
                    <div class="security-details">
                        <h5>Antivirus</h5>
                        <span class="security-status">${securityData.antivirus.name}: ${securityData.antivirus.status}</span>
                    </div>
                </div>`;
    } else {
        html += `
                <div class="security-item unknown">
                    <div class="security-icon">
                        <i class="fas fa-virus-slash"></i>
                    </div>
                    <div class="security-details">
                        <h5>Antivirus</h5>
                        <span class="security-status">Estado desconocido</span>
                    </div>
                </div>`;
    }
    
    // Actualizaciones
    if (securityData.updates) {
        const updatesClass = securityData.updates.status === 'UpToDate' ? 'success' : 'warning';
        html += `
                <div class="security-item ${updatesClass}">
                    <div class="security-icon">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Actualizaciones</h5>
                        <span class="security-status">${securityData.updates.status === 'UpToDate' ? 'Al día' : `${securityData.updates.count || 'Actualizaciones'} pendientes`}</span>
                    </div>
                </div>`;
    } else {
        html += `
                <div class="security-item unknown">
                    <div class="security-icon">
                        <i class="fas fa-sync-alt"></i>
                    </div>
                    <div class="security-details">
                        <h5>Actualizaciones</h5>
                        <span class="security-status">Estado desconocido</span>
                    </div>
                </div>`;
    }
    
    html += `
            </div>
        </div>`;
        
    // Recomendaciones de seguridad
    if (securityData.issues && securityData.issues.length > 0) {
        html += `
        <div class="component-detail-section">
            <h4>Problemas de seguridad detectados</h4>
            <div class="issues-list">`;
            
        securityData.issues.forEach(issue => {
            const severityClass = issue.severity === 'HIGH' ? 'high' : 
                                issue.severity === 'MEDIUM' ? 'medium' : 'low';
            
            html += `
                <div class="issue-item ${severityClass}">
                    <div class="issue-header">
                        <span class="issue-severity">${getSeverityText(issue.severity)}</span>
                        <h5 class="issue-title">${issue.description}</h5>
                    </div>
                    <p class="issue-recommendation">${issue.recommendation}</p>
                </div>`;
        });
        
        html += `
            </div>
        </div>`;
    } else {
        html += `
        <div class="component-detail-section">
            <div class="alert alert-success">
                <h5><i class="fas fa-check-circle"></i> Estado de seguridad óptimo</h5>
                <p>No se detectaron problemas de seguridad en su sistema.</p>
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
   scanProgressModal.style.display = 'none';
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
    cargarHistorialDiagnosticos();
    inicializarEstadoSistema();
    
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