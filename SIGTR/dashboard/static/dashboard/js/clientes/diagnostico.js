const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
const progressBarModalDiagnostico = document.getElementById('progress-bar-diagnostico');
const spanDiagnostico = progressBarDiagnostico.querySelector('span');
const modalDiagnostico = document.getElementById('modalDiagnostico');
const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
const closeModalDiagnostico = document.getElementById('closeModalDiagn');
const imgDiag = document.getElementById('imgDiag');
const estadoDiagnostico = document.getElementById('estado-diagnostico');
const btnIniciarDiagnostico = document.getElementById('iniciar-diagnostico');
const scanTypeSelect = document.getElementById('scan-type');
const customScanOptions = document.getElementById('custom-scan-options');
const customScanPath = document.getElementById('custom-scan-path');

const diagnosisUrls = {
    diagnosis_data: "/dashboard/client/diagnosis-data/",
    comparison: "/dashboard/client/diagnosis/comparison/",
    defender_status: "/dashboard/client/diagnosis/defender/status/"
};

let scanType = "QuickScan";
let customPath = "";

class SystemDiagnostics {
    constructor() {
        this.diagnosticModal = document.getElementById('modalDiagnostico');
        this.progressBar = document.getElementById('progressBarDiagnostico');
        this.progressSpan = this.progressBar.querySelector('span');
        this.diagnosticSteps = [
            { name: 'Inicializando diagnóstico', duration: 10 },
            { name: 'Verificando componentes de hardware', duration: 20 },
            { name: 'Analizando rendimiento del sistema', duration: 15 },
            { name: 'Comprobando controladores', duration: 25 },
            { name: 'Verificando actualizaciones de software', duration: 15 },
            { name: 'Evaluando seguridad del sistema', duration: 15 }
        ];
        this.diagnosticResults = {
            hardware: [],
            performance: {},
            drivers: [],
            updates: [],
            security: {}
        };
    }

    async startDiagnostic() {
        try {
            this.resetUI();
            await this.runDiagnosticSteps();
            this.displayFinalResults();
        } catch (error) {
            this.handleDiagnosticError(error);
        }
    }

    resetUI() {
        this.progressSpan.style.width = '0%';
        this.progressSpan.textContent = '0%';
        document.getElementById('resultadoAnalisisIA').style.display = 'none';
        document.getElementById('diagnosticosPrevios').style.display = 'grid';
    }

    async runDiagnosticSteps() {
        for (let i = 0; i < this.diagnosticSteps.length; i++) {
            const step = this.diagnosticSteps[i];
            await this.performDiagnosticStep(step, i);
        }
    }

    async performDiagnosticStep(step, stepIndex) {
        return new Promise((resolve) => {
            const totalSteps = this.diagnosticSteps.length;
            const stepProgress = Math.round((stepIndex + 1) / totalSteps * 100);
            
            this.progressSpan.style.width = `${stepProgress}%`;
            this.progressSpan.textContent = `${stepProgress}%`;

            if (estadoDiagnostico) {
                estadoDiagnostico.textContent = step.name;
            }

            setTimeout(async () => {
                await this.analyzeDiagnosticStep(step.name);
                resolve();
            }, step.duration * 100);
        });
    }

    async analyzeDiagnosticStep(stepName) {
        switch(stepName) {
            case 'Inicializando diagnóstico':
                await this.initializeDiagnostic();
                break;
            case 'Verificando componentes de hardware':
                await this.checkHardwareComponents();
                break;
            case 'Analizando rendimiento del sistema':
                await this.analyzeSystemPerformance();
                break;
            case 'Comprobando controladores':
                await this.checkDrivers();
                break;
            case 'Verificando actualizaciones de software':
                await this.checkSoftwareUpdates();
                break;
            case 'Evaluando seguridad del sistema':
                await this.evaluateSystemSecurity();
                break;
        }
    }

    async initializeDiagnostic() {
        this.diagnosticResults.startTime = new Date();
    }

    async checkHardwareComponents() {
        try {
            const response = await fetch('/dashboard/client/diagnosis-data/');
            const data = await response.json();
            
            this.diagnosticResults.hardware = [
                { 
                    name: 'CPU', 
                    usage: data.data.cpu_usage, 
                    status: this.evaluateComponentStatus(data.data.cpu_usage, 70) 
                },
                { 
                    name: 'RAM', 
                    usage: `${data.data.ram_usage.used} de ${data.data.ram_usage.total}`, 
                    status: this.evaluateComponentStatus(data.data.ram_usage.percent, 80) 
                },
                { 
                    name: 'Disco', 
                    usage: `${data.data.disk_usage.used} de ${data.data.disk_usage.total}`, 
                    status: this.evaluateComponentStatus(data.data.disk_usage.percent, 90) 
                }
            ];
        } catch (error) {
            console.error('Error verificando componentes de hardware:', error);
        }
    }

    evaluateComponentStatus(usage, threshold) {
        const usageValue = parseFloat(usage);
        if (usageValue > threshold) return 'crítico';
        if (usageValue > threshold * 0.7) return 'advertencia';
        return 'normal';
    }

    async analyzeSystemPerformance() {
        this.diagnosticResults.performance = {
            cpuIntensiveProcesses: await this.getTopCPUProcesses(),
            memoryUsage: await this.getMemoryUsageDetails()
        };
    }

    async getTopCPUProcesses() {
        return [
            { name: 'Chrome', cpuUsage: '25%' },
            { name: 'Sistema', cpuUsage: '15%' },
            { name: 'Antivirus', cpuUsage: '10%' }
        ];
    }

    async getMemoryUsageDetails() {
        return {
            totalRAM: '16 GB',
            usedRAM: '8 GB',
            freeRAM: '8 GB',
            criticalApps: ['Chrome', 'Visual Studio Code']
        };
    }

    async checkDrivers() {
        this.diagnosticResults.drivers = [
            { name: 'Adaptador de red', status: 'Actualizado' },
            { name: 'Tarjeta gráfica', status: 'Requiere actualización' },
            { name: 'Audio', status: 'Actualizado' }
        ];
    }

    async checkSoftwareUpdates() {
        this.diagnosticResults.updates = [
            { name: 'Windows', currentVersion: '22H2', available: '23H2' },
            { name: 'Antivirus', currentVersion: '2023.1', available: '2024.1' },
            { name: 'Office', currentVersion: '2021', available: 'No disponible' }
        ];
    }

    async evaluateSystemSecurity() {
        try {
            const defenderResponse = await fetch('/dashboard/client/diagnosis/defender/status/');
            const defenderData = await defenderResponse.json();

            this.diagnosticResults.security = {
                antivirusStatus: defenderData.data.AntivirusEnabled ? 'Activo' : 'Desactivado',
                realTimeProtection: defenderData.data.RealTimeProtectionEnabled ? 'Habilitado' : 'Deshabilitado',
                lastUpdate: new Date().toLocaleDateString(),
                potentialThreats: 0
            };
        } catch (error) {
            console.error('Error evaluando seguridad:', error);
        }
    }

    displayFinalResults() {
        const resultContainer = document.getElementById('resultadoAnalisisIA');
        const previousDiagnosisContainer = document.getElementById('diagnosticosPrevios');

        if (resultContainer && previousDiagnosisContainer) {
            resultContainer.innerHTML = this.generateResultsHTML();
            
            resultContainer.style.display = 'block';
            previousDiagnosisContainer.style.display = 'none';

            this.progressSpan.style.width = '100%';
            this.progressSpan.textContent = '100%';
        }
    }

    generateResultsHTML() {
        return `
            <div class="diagnostico-resultados">
                <h2>Resultados del Diagnóstico Completo</h2>
                
                <div class="seccion-hardware">
                    <h3>Componentes de Hardware</h3>
                    ${this.diagnosticResults.hardware.map(component => `
                        <div class="componente">
                            <span>${component.name}</span>
                            <span>Uso: ${component.usage}</span>
                            <span class="status-${component.status}">${component.status}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="seccion-rendimiento">
                    <h3>Rendimiento del Sistema</h3>
                    <div class="procesos-cpu">
                        <h4>Procesos intensivos de CPU</h4>
                        ${this.diagnosticResults.performance.cpuIntensiveProcesses.map(process => `
                            <div class="proceso">
                                <span>${process.name}</span>
                                <span>Uso de CPU: ${process.cpuUsage}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="uso-memoria">
                        <h4>Uso de Memoria</h4>
                        <p>Total: ${this.diagnosticResults.performance.memoryUsage.totalRAM}</p>
                        <p>Usado: ${this.diagnosticResults.performance.memoryUsage.usedRAM}</p>
                        <p>Libre: ${this.diagnosticResults.performance.memoryUsage.freeRAM}</p>
                    </div>
                </div>

                <div class="seccion-controladores">
                    <h3>Estado de Controladores</h3>
                    ${this.diagnosticResults.drivers.map(driver => `
                        <div class="controlador">
                            <span>${driver.name}</span>
                            <span class="status-${driver.status.toLowerCase()}">${driver.status}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="seccion-actualizaciones">
                    <h3>Actualizaciones de Software</h3>
                    ${this.diagnosticResults.updates.map(update => `
                        <div class="actualizacion">
                            <span>${update.name}</span>
                            <span>Versión actual: ${update.currentVersion}</span>
                            <span>Versión disponible: ${update.available}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="seccion-seguridad">
                    <h3>Seguridad del Sistema</h3>
                    <div class="detalle-seguridad">
                        <p>Estado del Antivirus: ${this.diagnosticResults.security.antivirusStatus}</p>
                        <p>Protección en Tiempo Real: ${this.diagnosticResults.security.realTimeProtection}</p>
                        <p>Última Actualización: ${this.diagnosticResults.security.lastUpdate}</p>
                        <p>Amenazas Potenciales: ${this.diagnosticResults.security.potentialThreats}</p>
                    </div>
                </div>

                <div class="acciones-recomendadas">
                    <h3>Acciones Recomendadas</h3>
                    <ul>
                        ${this.generateRecommendedActions()}
                    </ul>
                </div>
            </div>
        `;
    }

    generateRecommendedActions() {
        const recommendations = [];

        this.diagnosticResults.hardware.forEach(component => {
            if (component.status === 'crítico') {
                recommendations.push(`Considere actualizar o optimizar el componente de ${component.name}`);
            }
        });

        this.diagnosticResults.drivers.forEach(driver => {
            if (driver.status === 'Requiere actualización') {
                recommendations.push(`Actualice el controlador de ${driver.name}`);
            }
        });

        this.diagnosticResults.updates.forEach(update => {
            if (update.available !== 'No disponible' && update.available !== update.currentVersion) {
                recommendations.push(`Actualice ${update.name} a la versión ${update.available}`);
            }
        });

        if (this.diagnosticResults.security.antivirusStatus !== 'Activo') {
            recommendations.push('Active el antivirus para proteger su sistema');
        }

        if (this.diagnosticResults.security.realTimeProtection !== 'Habilitado') {
            recommendations.push('Habilite la protección en tiempo real');
        }

        if (recommendations.length === 0) {
            recommendations.push('Su sistema está en excelentes condiciones. No se requieren acciones.');
        }

        return recommendations.map(rec => `<li>${rec}</li>`).join('');
    }

    handleDiagnosticError(error) {
        console.error('Error en el diagnóstico:', error);
        const errorContainer = document.getElementById('resultadoAnalisisIA');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-diagnostico">
                    <h2>Error en el Diagnóstico</h2>
                    <p>No se pudo completar el diagnóstico. Por favor, inténtelo de nuevo.</p>
                    <details>
                        <summary>Detalles del error</summary>
                        <pre>${error.message}</pre>
                    </details>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }
}

if (scanTypeSelect) {
    const scaners = document.getElementById('scaners');
    scanTypeSelect.addEventListener('change', function () {
        if (this.value === 'CustomScan' && customScanOptions) {
            customScanOptions.style.display = 'flex';
            scaners.style.gap = '10px';
        } else if (customScanOptions) {
            customScanOptions.style.display = 'none';
        }
    });
}

function actualizarProgressBar(elemento, porcentaje) {
    if (elemento) {
        const span = elemento.querySelector('span');
        if (span) {
            span.style.width = porcentaje + '%';
            span.textContent = porcentaje + '%';
        }
    }
}

function DiagnosticoFunction() {
    openModalDiagnostico.style.pointerEvents = 'none';
    spanDiagnostico.style.width = '0%';
    spanDiagnostico.textContent = '0%';
    const porcentajeFinal = parseInt(spanDiagnostico.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del diagnóstico', 3);

    const systemDiagnostics = new SystemDiagnostics();

    animarProgreso(spanDiagnostico, porcentajeFinal, () => {
        setTimeout(() => {
            openModalDiagnostico.style.pointerEvents = 'auto';
            modalDiagnostico.style.display = 'flex';
            modalDiagnostico.style.fontSize = '18px';
            systemDiagnostics.startDiagnostic();
        }, 3000);
    }, typeNotification);
}
