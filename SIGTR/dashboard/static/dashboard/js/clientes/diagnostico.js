const modalDiagnostico = document.getElementById('modalDiagnostico');
const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagnostico = document.getElementById('closeModalDiagn');
const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
const imgDiagnostico = document.getElementById('imgDiagnosticoDet');
const spanDiagnostico = progressBarDiagnostico.querySelector('span');
const startQuickScanBtn = document.getElementById('start-quick-scan');
const startCustomScanBtn = document.getElementById('start-custom-scan');
const quickScanProgressBar = document.getElementById('quick-scan-progress');
const quickScanProgressSpan = quickScanProgressBar ? quickScanProgressBar.querySelector('span') : null;
const scanProgressModal = document.getElementById('scanProgressModal');
const scanProgressBar = document.getElementById('scan-progress-bar');
const scanProgressSpan = scanProgressBar ? scanProgressBar.querySelector('span') : null;
const scanPercentage = document.getElementById('scan-percentage');
const currentComponentScan = document.getElementById('current-component-scan');
const scanDetailsText = document.getElementById('scan-details-text');
const detailedResults = document.getElementById('detailed-results');
const detailedResultsContent = document.getElementById('detailed-results-content');
const backToDiagnosisBtn = document.getElementById('back-to-diagnosis');
const scenarioButtons = document.querySelectorAll('.scenario-button');
const diagnosticTabs = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

modalDiagnostico.classList.add('modal-hidden');

let diagnosisId = null;
let reportId = null;
let isScanning = false;

function DiagnosticoFunction() {
    openModalDiagnostico.style.pointerEvents = 'none';
    spanDiagnostico.style.width = '0%';
    spanDiagnostico.textContent = '0%';
    const porcentajeFinal = parseInt(spanDiagnostico.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del sistema', 6);

    animarProgreso(spanDiagnostico, porcentajeFinal, () => {
        setTimeout(() => {
            openModalDiagnostico.style.pointerEvents = 'auto';
            modalDiagnostico.style.display = 'flex';
            modalDiagnostico.style.fontSize = '18px';
        }, 3000);
    }, typeNotification);
}

openModalDiagnostico.style.cursor = 'pointer';
openModalDiagnostico.addEventListener('click', function () {
    const contenedorDiag = document.querySelector(".detdiagnostico");
    contenedorDiag.classList.add("borde-animado");
    
    if (btnPressAnalisis) {
        modalDiagnostico.style.display = 'flex';
    } else {
        DiagnosticoFunction();
    }
    imgDiagnostico.style.height = '70px';
    progressBarDiagnostico.style.display = 'flex';
});

closeModalDiagnostico.addEventListener('click', function () {
    modalDiagnostico.style.display = 'none';
});

window.addEventListener('click', function (event) {
    if (event.target == modalDiagnostico) {
        modalDiagnostico.style.display = 'none';
    }
    if (event.target == scanProgressModal) {
        if (!isScanning) {
            scanProgressModal.style.display = 'none';
        }
    }
});

if (startQuickScanBtn) {
    startQuickScanBtn.addEventListener('click', function() {
        startDiagnosticScan('QuickScan');
    });
}

if (startCustomScanBtn) {
    startCustomScanBtn.addEventListener('click', function() {
        const selectedComponents = [];
        const checkboxes = document.querySelectorAll('.component-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            selectedComponents.push(checkbox.id.replace('check-', ''));
        });
        
        startDiagnosticScan('CustomScan', selectedComponents);
    });
}

if (backToDiagnosisBtn) {
    backToDiagnosisBtn.addEventListener('click', function() {
        detailedResults.style.display = 'none';
        document.querySelector('.contentData').style.display = 'block';
    });
}

scenarioButtons.forEach(button => {
    button.addEventListener('click', function() {
        const scenarioType = this.parentElement.querySelector('h4').textContent.trim();
        const scenarioId = getScenarioIdByName(scenarioType);
        
        if (scenarioId) {
            runDiagnosticScenario(scenarioId);
        } else {
            mostrarNotificacion('error', 'Escenario no disponible', 3);
        }
    });
});

diagnosticTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        diagnosticTabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'diagnosis-history') {
            loadDiagnosticHistory();
        }
    });
});

const componentAllCheckbox = document.getElementById('check-all');
if (componentAllCheckbox) {
    componentAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.component-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            checkbox.disabled = this.checked;
        });
    });
}

function startDiagnosticScan(scanType, components = []) {
    isScanning = true;
    
    scanProgressModal.style.display = 'flex';
    updateScanProgress(0, 'Iniciando diagnóstico...');
    
    simulateDiagnosticProgress();
}

function simulateDiagnosticProgress() {
    let progress = 0;
    const components = [
        'Iniciando diagnóstico...',
        'Analizando CPU...',
        'Analizando memoria RAM...',
        'Analizando almacenamiento...',
        'Analizando red...',
        'Analizando tarjeta gráfica...',
        'Analizando controladores...',
        'Analizando software...',
        'Analizando seguridad...',
        'Generando reporte...'
    ];
    
    const progressInterval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                isScanning = false;
                scanProgressModal.style.display = 'none';
                loadSystemData();
                mostrarNotificacion('success', 'Diagnóstico completado correctamente', 3);
            }, 1000);
            return;
        }
        
        progress += 10;
        const componentIndex = Math.min(Math.floor(progress / 10), components.length - 1);
        updateScanProgress(progress, components[componentIndex]);
    }, 1000);
}

function updateScanProgress(progress, component) {
    if (scanProgressSpan) {
        scanProgressSpan.style.width = `${progress}%`;
        scanProgressSpan.setAttribute('data-width', `${progress}%`);
    }
    
    if (scanPercentage) {
        scanPercentage.textContent = `${progress}%`;
    }
    
    if (currentComponentScan) {
        currentComponentScan.textContent = component || 'Analizando sistema...';
    }
    
    if (scanDetailsText) {
        if (progress < 25) {
            scanDetailsText.textContent = 'Analizando componentes básicos del sistema...';
        } else if (progress < 50) {
            scanDetailsText.textContent = 'Verificando rendimiento y estado de los dispositivos...';
        } else if (progress < 75) {
            scanDetailsText.textContent = 'Buscando problemas y optimizaciones posibles...';
        } else {
            scanDetailsText.textContent = 'Finalizando y generando informe...';
        }
    }
    
    if (quickScanProgressSpan) {
        quickScanProgressSpan.style.width = `${progress}%`;
        quickScanProgressSpan.setAttribute('data-width', `${progress}%`);
        quickScanProgressSpan.textContent = `${progress}%`;
    }
}

function loadSystemData() {
    getSystemDataMock();
}

function getSystemDataMock() {
    const systemData = {
        cpu_usage: "24.8%",
        cpu_temp: "45.2°C",
        cpu_freq: "3200 MHz",
        cpu_cores: 8,
        ram_usage: {
            total: "16.00 GB",
            available: "6.98 GB",
            used: "9.02 GB",
            free: "6.98 GB",
            percent: "56.3%"
        },
        swap_usage: {
            total: "8.00 GB",
            used: "2.14 GB",
            free: "5.86 GB",
            percent: "26.8%"
        },
        disk_usage: {
            partitions: [
                {
                    device: "C:",
                    mountpoint: "C:",
                    fstype: "NTFS",
                    total: "512.00 GB",
                    used: "386.77 GB",
                    free: "125.23 GB",
                    percent: "75.6%"
                },
                {
                    device: "D:",
                    mountpoint: "D:",
                    fstype: "NTFS",
                    total: "1024.00 GB",
                    used: "645.12 GB",
                    free: "378.88 GB",
                    percent: "63.0%"
                }
            ]
        },
        network: {
            bytes_sent: "1.25 GB",
            bytes_recv: "8.54 GB",
            packets_sent: 1456789,
            packets_recv: 8745216,
            connections: 12
        },
        system_info: {
            system: "Windows",
            version: "10 Pro",
            release: "21H2",
            machine: "AMD64",
            processor: "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz"
        },
        gpu_info: [
            {
                name: "NVIDIA GeForce RTX 3060",
                memory: "8.00 GB",
                driver: "511.79"
            }
        ],
        top_processes: [
            {
                pid: 1234,
                name: "chrome.exe",
                cpu_percent: "8.5%",
                memory_percent: "12.3%"
            },
            {
                pid: 5678,
                name: "discord.exe",
                cpu_percent: "4.2%",
                memory_percent: "5.8%"
            },
            {
                pid: 9012,
                name: "explorer.exe",
                cpu_percent: "2.1%",
                memory_percent: "3.4%"
            }
        ]
    };

    updateSystemMetrics(systemData);
    displayDiagnosticResults();
    loadDiagnosticHistory();
}

function displayDiagnosticResults() {
    detailedResults.style.display = 'block';
    document.querySelector('.contentData').style.display = 'none';
    
    let resultHTML = `
        <div class="diagnosis-summary">
            <h3>Resumen del diagnóstico</h3>
            <div class="diagnosis-stats">
                <div class="stat-item critical">
                    <span class="stat-value">0</span>
                    <span class="stat-label">Problemas críticos</span>
                </div>
                <div class="stat-item warning">
                    <span class="stat-value">2</span>
                    <span class="stat-label">Advertencias</span>
                </div>
                <div class="stat-item suggestion">
                    <span class="stat-value">3</span>
                    <span class="stat-label">Sugerencias</span>
                </div>
            </div>
            <div class="overall-status">
                <span class="status-label">Estado general del sistema:</span>
                <span class="status-value warning">Normal</span>
            </div>
        </div>
    `;
    
    resultHTML += `<div class="diagnosis-issues">
        <h3>Problemas detectados</h3>
        <div class="issues-list">
            <div class="issue-item warning">
                <div class="issue-header">
                    <span class="issue-component">Almacenamiento</span>
                    <span class="issue-status warning">Pendiente</span>
                </div>
                <div class="issue-description">
                    <p class="issue-text">Disco casi lleno (75.6% utilizado)</p>
                    <p class="issue-recommendation">Considere liberar espacio eliminando archivos innecesarios o utilice la limpieza de disco.</p>
                    <button class="resolve-button" data-issue-id="1">Marcar como resuelto</button>
                </div>
            </div>
            <div class="issue-item warning">
                <div class="issue-header">
                    <span class="issue-component">Memoria RAM</span>
                    <span class="issue-status warning">Pendiente</span>
                </div>
                <div class="issue-description">
                    <p class="issue-text">Uso elevado de memoria (56.3%)</p>
                    <p class="issue-recommendation">Considere cerrar aplicaciones en segundo plano que no esté utilizando para liberar memoria.</p>
                    <button class="resolve-button" data-issue-id="2">Marcar como resuelto</button>
                </div>
            </div>
        </div>
    </div>`;
    
    resultHTML += `<div class="diagnosis-components">
        <h3>Componentes analizados</h3>
        <div class="components-list">
            <div class="component-item">
                <div class="component-header normal">
                    <span class="component-name">CPU</span>
                    <span class="component-status">NORMAL</span>
                </div>
                <div class="component-details">
                    <p class="component-recommendations">El procesador está funcionando correctamente con un uso del 24.8%.</p>
                </div>
            </div>
            <div class="component-item">
                <div class="component-header warning">
                    <span class="component-name">Memoria RAM</span>
                    <span class="component-status">WARNING</span>
                </div>
                <div class="component-details">
                    <p class="component-recommendations">Considere cerrar aplicaciones en segundo plano que no esté utilizando para liberar memoria.</p>
                </div>
            </div>
            <div class="component-item">
                <div class="component-header warning">
                    <span class="component-name">Almacenamiento</span>
                    <span class="component-status">WARNING</span>
                </div>
                <div class="component-details">
                    <p class="component-recommendations">Considere liberar espacio eliminando archivos innecesarios o utilice la limpieza de disco.</p>
                </div>
            </div>
        </div>
    </div>`;
    
    detailedResultsContent.innerHTML = resultHTML;
    
    document.querySelectorAll('.resolve-button').forEach(button => {
        button.addEventListener('click', function() {
            const issueId = this.getAttribute('data-issue-id');
            markIssueAsResolved(issueId);
        });
    });
    
    loadComparisonData();
}

function markIssueAsResolved(issueId) {
    const issueButton = document.querySelector(`.resolve-button[data-issue-id="${issueId}"]`);
    if (issueButton) {
        const issueItem = issueButton.closest('.issue-item');
        issueItem.classList.add('resolved');
        
        const statusSpan = issueItem.querySelector('.issue-status');
        statusSpan.textContent = 'Resuelto';
        statusSpan.className = 'issue-status success';
        
        issueButton.remove();
        
        mostrarNotificacion('success', 'Problema marcado como resuelto', 3);
    }
}

function loadComparisonData() {
    const comparisonHTML = `
        <div class="diagnosis-comparison">
            <h3>Comparación con diagnóstico anterior (29/04/2025 7:44:02)</h3>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <span class="comparison-label">CPU:</span>
                    <span class="comparison-value better">↓ 7.40%</span>
                </div>
                <div class="comparison-item">
                    <span class="comparison-label">RAM:</span>
                    <span class="comparison-value worse">↑ 0.40%</span>
                </div>
                <div class="comparison-item">
                    <span class="comparison-label">Disco:</span>
                    <span class="comparison-value">→ 0.00%</span>
                </div>
            </div>
        </div>
    `;
    
    detailedResultsContent.innerHTML += comparisonHTML;
}

function runDiagnosticScenario(scenarioId) {
    scanProgressModal.style.display = 'flex';
    updateScanProgress(0, 'Iniciando escenario de diagnóstico...');
    isScanning = true;
    
    setTimeout(() => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            updateScanProgress(progress, 'Analizando escenario...');
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    displayScenarioResults(scenarioId);
                    scanProgressModal.style.display = 'none';
                    isScanning = false;
                }, 500);
            }
        }, 300);
    }, 500);
}

function displayScenarioResults(scenarioId) {
    const scenarioData = getScenarioData(scenarioId);
    
    detailedResults.style.display = 'block';
    document.querySelector('.contentData').style.display = 'none';
    
    const statusClass = getStatusClass(scenarioData.status);
    
    let resultHTML = `
        <div class="scenario-results">
            <h3>${scenarioData.scenario}</h3>
            <div class="scenario-status ${statusClass}">
                <span class="status-label">Estado:</span>
                <span class="status-value">${scenarioData.status}</span>
            </div>
            <div class="scenario-recommendations">
                <h4>Recomendaciones</h4>
                <p>${scenarioData.recommendations}</p>
            </div>
    `;
    
    if (scenarioData.issues && scenarioData.issues.length > 0) {
        resultHTML += `
            <div class="scenario-issues">
                <h4>Problemas detectados</h4>
                <div class="issues-list">
        `;
        
        scenarioData.issues.forEach(issue => {
            const severityClass = issue.severity === 'Alto' ? 'critical' : 
                                issue.severity === 'Medio' ? 'warning' : 'suggestion';
            
            resultHTML += `
                <div class="issue-item ${severityClass}">
                    <div class="issue-header">
                        <span class="issue-type">${issue.type}</span>
                        <span class="issue-severity ${severityClass}">${issue.severity}</span>
                    </div>
                    <div class="issue-description">
                        <p class="issue-text">${issue.description}</p>
                        <p class="issue-recommendation">${issue.recommendation}</p>
                    </div>
                </div>
            `;
        });
        
        resultHTML += `
                </div>
            </div>
        `;
    }
    
    resultHTML += `</div>`;
    
    detailedResultsContent.innerHTML = resultHTML;
}

function getScenarioData(scenarioId) {
    const scenarios = {
        1: {
            scenario: 'Error de pantalla azul',
            status: 'Normal',
            recommendations: 'No se encontraron indicios claros de pantallas azules recientes en su sistema. Si experimenta pantallas azules, anote el código de error cuando aparezca y ejecute un análisis más detallado.',
            issues: []
        },
        2: {
            scenario: 'Sistema lento',
            status: 'Advertencia',
            recommendations: 'Se han detectado algunos factores que podrían estar ralentizando su sistema. Ejecute el desfragmentador de disco para mejorar el rendimiento y considere cerrar aplicaciones que consumen muchos recursos.',
            issues: [
                {
                    type: 'RENDIMIENTO',
                    severity: 'Medio',
                    description: 'Disco fragmentado (23.5%)',
                    recommendation: 'Ejecute el desfragmentador de disco para mejorar el rendimiento.'
                },
                {
                    type: 'RENDIMIENTO',
                    severity: 'Medio',
                    description: 'Demasiados programas de inicio (12)',
                    recommendation: 'Desactive programas de inicio innecesarios a través del Administrador de tareas.'
                }
            ]
        },
        3: {
            scenario: 'Problemas de conectividad',
            status: 'Normal',
            recommendations: 'Su conexión de red parece estar funcionando correctamente. La velocidad de ping es buena (45ms) y todos los adaptadores de red están funcionando correctamente.',
            issues: []
        },
        4: {
            scenario: 'Error del controlador',
            status: 'Advertencia',
            recommendations: 'Se encontraron controladores desactualizados que podrían causar problemas de estabilidad o rendimiento. Actualice los controladores mencionados para mejorar la compatibilidad y el rendimiento del sistema.',
            issues: [
                {
                    type: 'CONTROLADOR',
                    severity: 'Medio',
                    description: 'Controlador de tarjeta gráfica desactualizado',
                    recommendation: 'Actualice el controlador de su tarjeta gráfica a la última versión disponible.'
                }
            ]
        },
        5: {
            scenario: 'El sistema no responde',
            status: 'Normal',
            recommendations: 'No se encontraron causas evidentes para que el sistema no responda. Si el sistema deja de responder frecuentemente, considere reiniciar en modo seguro para descartar problemas con software de terceros.',
            issues: []
        },
        6: {
            scenario: 'Tiempo de arranque lento',
            status: 'Advertencia',
            recommendations: 'Se han detectado factores que podrían estar ralentizando el arranque del sistema. Reduzca el número de programas que se inician automáticamente y considere desfragmentar el disco duro.',
            issues: [
                {
                    type: 'RENDIMIENTO',
                    severity: 'Medio',
                    description: 'Demasiados programas de inicio (12)',
                    recommendation: 'Reduzca el número de programas que se inician automáticamente a través del Administrador de tareas > Inicio.'
                },
                {
                    type: 'RENDIMIENTO',
                    severity: 'Bajo',
                    description: 'Disco fragmentado (23.5%)',
                    recommendation: 'Ejecute el desfragmentador de disco para mejorar el tiempo de arranque.'
                }
            ]
        },
        7: {
            scenario: 'Problemas con la batería',
            status: 'Crítico',
            recommendations: 'Se ha detectado que la salud de su batería está significativamente reducida. La capacidad actual es del 52% respecto a la capacidad original. Considere reemplazar la batería para mejorar la autonomía.',
            issues: [
                {
                    type: 'HARDWARE',
                    severity: 'Alto',
                    description: 'Salud de batería deteriorada (52%)',
                    recommendation: 'La capacidad de su batería está significativamente reducida. Considere reemplazarla para mejorar la autonomía.'
                },
                {
                    type: 'CONFIGURACIÓN',
                    severity: 'Medio',
                    description: 'Plan de energía de alto rendimiento activo',
                    recommendation: 'Este plan consume más batería. Cambie a "Equilibrado" o "Ahorro de energía" para mejorar la duración de la batería.'
                }
            ]
        }
    };
    
    return scenarios[scenarioId] || {
        scenario: 'Escenario desconocido',
        status: 'Desconocido',
        recommendations: 'No hay información disponible para este escenario.',
        issues: []
    };
}

function loadDiagnosticHistory() {
    const historyContainer = document.querySelector('.components-list');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '<div class="loading">Cargando historial...</div>';
    
    const demoData = [
        { date: '29/4/2025, 7:44:15', cpu: '17.4%', ram: '56.3%', disk: '75.6%' },
        { date: '29/4/2025, 7:44:02', cpu: '24.8%', ram: '56.7%', disk: '75.6%' },
        { date: '29/4/2025, 7:43:03', cpu: '20.9%', ram: '57.0%', disk: '75.6%' },
        { date: '29/4/2025, 10:28:50', cpu: '15.8%', ram: '58.3%', disk: '75.5%' },
        { date: '23/4/2025, 11:13:56', cpu: '21.5%', ram: '55.6%', disk: '75.3%' }
    ];
    
    let historyHTML = '';
    
    demoData.forEach(item => {
        historyHTML += `
            <div class="component-item">
                <div class="component-status success">
                    <i class="fa-solid fa-check-circle"></i>
                </div>
                <div class="component-name">
                    <div>QuickScan | ${item.date}</div>
                    <div>CPU: ${item.cpu} | RAM: ${item.ram} | Disco: ${item.disk}</div>
                </div>
                <div class="component-details-toggle">
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = historyHTML;
    
    document.querySelectorAll('.component-details-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const componentItem = this.closest('.component-item');
            componentItem.classList.toggle('expanded');
            
            const icon = this.querySelector('i');
            if (componentItem.classList.contains('expanded')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });
}

function updateSystemMetrics(data) {
    const cpuElement = document.getElementById('cpu-usage');
    const ramElement = document.getElementById('ram-usage');
    const diskElement = document.getElementById('disk-usage');
    
    if (cpuElement) {
        cpuElement.textContent = data.cpu_usage || '24.8%';
        cpuElement.className = getValueColorClass(parseFloat(data.cpu_usage || '24.8%'));
    }
    
    if (ramElement) {
        ramElement.textContent = data.ram_usage.percent || '56.3%';
        ramElement.className = getValueColorClass(parseFloat(data.ram_usage.percent || '56.3%'));
    }
    
    if (diskElement) {
        diskElement.textContent = data.disk_usage.partitions[0].percent || '75.6%';
        diskElement.className = getValueColorClass(parseFloat(data.disk_usage.partitions[0].percent || '75.6%'));
    }
}

function getScenarioIdByName(name) {
    const scenarioMap = {
        'Error de pantalla azul': 1,
        'Sistema lento': 2,
        'Problemas de conectividad': 3,
        'Error del controlador': 4,
        'El sistema no responde': 5,
        'Tiempo de arranque lento': 6,
        'Problemas con la batería': 7
    };
    
    return scenarioMap[name] || null;
}

function getStatusClass(status) {
    if (!status) return 'normal';
    
    status = status.toLowerCase();
    
    if (status === 'crítico' || status === 'critical' || status === 'error') {
        return 'critical';
    } else if (status === 'advertencia' || status === 'warning') {
        return 'warning';
    } else if (status === 'normal' || status === 'ok' || status === 'success') {
        return 'success';
    } else {
        return 'normal';
    }
}

function getValueColorClass(value) {
    if (isNaN(value)) return '';
    
    if (value > 90) {
        return 'text-danger';
    } else if (value > 70) {
        return 'text-warning';
    } else {
        return 'text-success';
    }
}

function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
}

function mostrarNotificacion(tipo, mensaje, duracion) {
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(tipo, mensaje, duracion);
    } else {
        console.log(`${tipo}: ${mensaje}`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const iniciarDiagnosticoBtn = document.getElementById('iniciarDiagnostico');
    if (iniciarDiagnosticoBtn) {
        iniciarDiagnosticoBtn.addEventListener('click', function() {
            startDiagnosticScan('QuickScan');
        });
    }
    
    const iniciarRevisionBtn = document.getElementById('iniciarRevision');
    if (iniciarRevisionBtn) {
        iniciarRevisionBtn.addEventListener('click', function() {
            const selectedComponents = [];
            document.querySelectorAll('input[type="checkbox"]:checked:not(#checkAll)').forEach(checkbox => {
                selectedComponents.push(checkbox.id.replace('check-', ''));
            });
            
            startDiagnosticScan('CustomScan', selectedComponents);
        });
    }
});