const modalAntivirus = document.getElementById('modalAntivirus');
const openModalAntivirus = document.getElementById('btnAbrirModalAntivirus');
const closeModalAntivirus = document.getElementById('closeModalAnt');
const progressBarAnt = document.getElementById('progressBarAntivirus');
const spanAnt = progressBarAnt.querySelector('span');
const imgDetDiag = document.getElementById('imgAntivirusDet');

const antivirusHabilitadoElement = document.getElementById('antivirusHabilitado');
const proteccionTiempoRealElement = document.getElementById('proteccionTiempoReal');
const versionAntivirusElement = document.getElementById('versionAntivirus');

function AntivirusFunction() {
    openModalAntivirus.style.pointerEvents = 'none';
    spanAnt.style.width = '0%';
    spanAnt.textContent = '0%';
    const porcentajeFinal = parseInt(spanAnt.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del antivirus', 4);

    animarProgreso(spanAnt, porcentajeFinal, () => {
        setTimeout(() => {
            modalAntivirus.style.display = 'flex';
            openModalAntivirus.style.pointerEvents = 'auto'; 
        }, 3000);
    }, typeNotification);
}
openModalAntivirus.style.cursor = 'pointer';
openModalAntivirus.addEventListener('click', function () {
    obtenerEstadoAntivirus();
    AntivirusFunction();
    imgDetDiag.style.height = '70px';
    openModalAntivirus.style.fontSize = '18px';
    progressBarAnt.style.display = 'flex';
})

closeModalAntivirus.addEventListener('click', function () {
    modalAntivirus.style.display = 'none';
});

window.addEventListener('click', function (event) {
    if (event.target == modalAntivirus) {
        modalAntivirus.style.display = 'none';
    }
});

async function obtenerEstadoAntivirus() {
    try {
        const response = await fetch('/dashboard/client/diagnosis/defender/status/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener el estado del antivirus');
        }

        const data = await response.json();

        if (data.status === 'success') {
            antivirusHabilitadoElement.textContent = data.data.AntivirusEnabled ? 'Sí' : 'No';
            proteccionTiempoRealElement.textContent = data.data.RealTimeProtectionEnabled ? 'Activado' : 'Desactivado';
            versionAntivirusElement.textContent = data.data.AntivirusSignatureVersion || 'No disponible';

            const estadoProteccionElement = document.getElementById('estadoProteccion');
            const ultimasAmenazasElement = document.getElementById('ultimasAmenazas');
            const recomendacionesElement = document.getElementById('recomendacionesSeguridad');

            const proteccionActiva = data.data.AntivirusEnabled && data.data.RealTimeProtectionEnabled;
            estadoProteccionElement.textContent = proteccionActiva ? 'Sistema Protegido' : 'Sistema Vulnerable';
            estadoProteccionElement.style.color = proteccionActiva ? 'green' : 'red';

            ultimasAmenazasElement.textContent = 'No se detectaron amenazas recientes';

            if (!proteccionActiva) {
                recomendacionesElement.innerHTML = `
                    <ul>
                        <li>Activar protección en tiempo real</li>
                        <li>Actualizar firmas de antivirus</li>
                        <li>Realizar escaneo completo del sistema</li>
                    </ul>
                `;
            } else {
                recomendacionesElement.innerHTML = `
                    <ul>
                        <li>Mantener actualizaciones al día</li>
                        <li>Realizar escaneos periódicos</li>
                        <li>Revisar configuraciones de seguridad</li>
                    </ul>
                `;
            }

            if (!proteccionActiva) {
                mostrarNotificacion('warning', 'Sistema de seguridad no está completamente protegido', 5);
            }
        } else {
            mostrarNotificacion('error', 'No se pudo obtener el estado del antivirus', 3);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error al verificar el estado del antivirus', 3);
    }
}

// btnOptimizarAntivirus.addEventListener('click', function() {
//     openModalAntivirus.style.cursor = 'pointer';
//     openModalAntivirus.addEventListener('click', function () {
//         modalAntivirus.style.display = 'flex';
//     });

//     imgDetDiag.style.height = '70px';
//     openModalAntivirus.style.fontSize = '18px';
//     progressBarAnt.style.display = 'flex';

//     let progress = 0;
//     const spanProgreso = progressBarAnt.querySelector('span');

//     const etapas = [
//         { porcentaje: 20, mensaje: "Inicializando análisis..." },
//         { porcentaje: 40, mensaje: "Escaneando archivos del sistema..." },
//         { porcentaje: 60, mensaje: "Verificando amenazas potenciales..." },
//         { porcentaje: 80, mensaje: "Finalizando análisis de seguridad..." },
//         { porcentaje: 100, mensaje: "Análisis completado" }
//     ];

//     const interval = setInterval(() => {
//         if (progress >= 100) {
//             clearInterval(interval);
//             notificacionAntivirus();
//             obtenerEstadoAntivirus();
//             return;
//         }

//         const etapaActual = etapas.find(etapa => etapa.porcentaje > progress);

//         progress = etapaActual.porcentaje;
//         spanProgreso.style.width = `${progress}%`;
//         spanProgreso.textContent = `${progress}%`;

//         mostrarNotificacion('info', etapaActual.mensaje, 2);
//     }, 500);
// });

