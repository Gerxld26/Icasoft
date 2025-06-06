let chartGlobal;
let modalOpen = false;
let notiMostrada = false;
let intervalId;
let discosNotificados = new Set();
/*MONITOREO*/
const modalMonitoreo = document.getElementById('modalMonitoreo');
const openModalMonitoreo = document.getElementById('btnMonitoreo');
const closeModalbtn = document.getElementById('closeModal');
const imgGrafico = document.getElementById('imgGraficoMonitoreo');
const progressBar = document.getElementById('progressBarMonitoreo');
const spanMonitoreo = progressBar.querySelector('span');

function MonitoreoFunction() {
    openModalMonitoreo.style.pointerEvents = 'none';
    spanMonitoreo.style.width = '0%';
    spanMonitoreo.textContent = '0%';
    const porcentajeFinal = parseInt(spanMonitoreo.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del monitoreo');

    animarProgreso(spanMonitoreo, porcentajeFinal, () => {
        setTimeout(() => {
            modalMonitoreo.style.display = 'flex';
            openModalMonitoreo.style.pointerEvents = 'auto';
            fetchCpuData();
        }, 4000);
    }, typeNotification);
}
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
/*MODAL MONITOREO*/
openModalMonitoreo.style.cursor = 'pointer';
openModalMonitoreo.addEventListener('click', function () {
    deshabilitarBotones('monitoreo');
    const contenedorMon = document.querySelector(".monitoreo");
    contenedorMon.classList.add("borde-animado");
    const textDivMonitoreo = document.getElementById('textMonitoreo');
    modalOpen = true;
    notiMostrada = true;
    if (btnPressAnalisis) { //si el btnPressAnalisis es true.
        fetchCpuData();
        modalMonitoreo.style.display = 'flex';
    } else {
        MonitoreoFunction();
    }
    imgGrafico.style.animation = "rotarImg 1.5s linear infinite";
    progressBar.style.display = 'flex';
    imgGrafico.style.height = '80px';
    textDivMonitoreo.style.padding = '0';
    intervalId = setInterval(fetchCpuData, 5000);
});


closeModalbtn.addEventListener('click', function () {
    habilitarBotones('monitoreo');
    modalMonitoreo.style.display = 'none';
    modalOpen = false;
    notiMostrada = false;
    imgGrafico.style.animation = "none";
    clearInterval(intervalId);
    notificationDevice.style.display = 'none';
    discosNotificados.clear();
    // imgGrafico.style.animation = "rotarImg 1.5s linear infinite";

});

// Cerrar el modal si se hace clic fuera del contenido del modal 
window.addEventListener('click', function (event) {
    if (event.target == modalMonitoreo) {
        habilitarBotones('monitoreo');
        modalMonitoreo.style.display = 'none';
        modalOpen = false;
        notiMostrada = false;
        imgGrafico.style.animation = "none";
        // imgGrafico.style.animation = "rotarImg 1.5s linear infinite";
        clearInterval(intervalId);
        notificationDevice.style.display = 'none';
        discosNotificados.clear();
    }
});
// Función que obtiene los datos de RAM y actualiza el progreso
async function fetchCpuData() {
    try {

        const responseCPU = await fetch('/dashboard/client/monitoring/cpu/data/');
        const responseRAM = await fetch('/dashboard/client/monitoring/ram/data/'); //la ruta se definió en el views  client_monitoring_ram_data
        const responseDISK = await fetch('/dashboard/client/monitoring/disk/data');
        let discosCriticos = [];
        const dataCPU = await responseCPU.json();
        const dataRAM = await responseRAM.json();
        const dataDisk = await responseDISK.json();
        //Barra de progreso CPU dinámico:
        const spanCPU = document.getElementById('progress-bar-cpu').querySelector('span');
        const textCPU = document.getElementById('cpu-progress-text');
        const cpuName = document.getElementById('cpu-name');
        cpuName.textContent = `Modelo: ${dataCPU.cpu_name}`;

        // Barra de progreso de RAM dinámico:
        const spanRAM = document.getElementById('progress-bar-ram').querySelector('span');
        const sistemaOperativoText = document.getElementById('sistemaOperativotext');
        sistemaOperativoText.textContent = `En uso: ${dataRAM.used} GB`;


        if (parseInt(dataCPU.usage) >= 0 && parseInt(dataCPU.usage) <= 30) {
            //CPU
            spanCPU.style.width = dataCPU.usage + '%'; //el ancho de lo pintado
            spanCPU.style.paddingLeft = '30px';
            textCPU.textContent = dataCPU.usage + '%';
            textCPU.style.color = 'green';
            spanCPU.style.backgroundColor = "green";

        } else if (parseInt(dataCPU.usage) > 30 && parseInt(dataCPU.usage) <= 50) {
            //CPU
            textCPU.style.display = 'none'; // para que no se nota la etiqueta del centro
            spanCPU.style.width = dataCPU.usage + '%';
            spanCPU.innerHTML = dataCPU.usage + '%';
            spanCPU.style.backgroundColor = "green";
        } else if (parseInt(dataCPU.usage) > 50 && parseInt(dataCPU.usage) <= 79) {
            //CPU
            textCPU.style.display = 'none';
            spanCPU.style.width = dataCPU.usage + '%';
            spanCPU.innerHTML = dataCPU.usage + '%';
            spanCPU.style.backgroundColor = "orange";
        } else {
            //CPU
            textCPU.style.display = 'none';
            spanCPU.style.width = dataCPU.usage + '%';
            spanCPU.innerHTML = dataCPU.usage + '%';
            spanCPU.style.backgroundColor = "red";

        }
        //RAM
        if (parseInt(dataRAM.percent) >= 0 && parseInt(dataRAM.percent) <= 50) {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "green";

        } else if (parseInt(dataRAM.percent) > 50 && parseInt(dataRAM.percent) <= 79) {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "orange";
        } else {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "red"; // Rojo
            notificacionDetalle("La memoria ram está saturada");
        }

        //DISCOS
        var textDisk = '';
        const datosDiscos = dataDisk.disks;
        datosDiscos.forEach((diskDetails, index) => {
            textDisk += '<div class="device">';
            textDisk += '<div class="textContentHW disco-nombre" style="width:100%;">'
            textDisk += '<div>( ' + diskDetails.device + ' )</div>';
            textDisk += '<div style = "color: rgb(255 255 255 / 60%); font-family: "Gill Sans Extrabold", Helvetica, sans-serif; width:100%">' + diskDetails.used + ' en uso de ' + diskDetails.total + '</div>';
            textDisk += '</div>';
            textDisk += '<div class="progress-bar-Monitoreo">';
            textDisk += '<span class="disco-bar" id="disco-bar-' + index + '" data-width="0%"></span>';
            textDisk += '<div class="progress-text" id="disk-progress-text' + index + '">0%</div>';
            textDisk += '</div>';
            textDisk += '</div>';
        });
        $("#contentDisco").html(textDisk);
        if (datosDiscos.length > 3) {
            modalMonitoreo.classList.add('two-columns');
        } else {
            modalMonitoreo.classList.remove('two-columns');
        }
        datosDiscos.forEach((diskDetails, index) => {
            const diskBar = document.getElementById('disco-bar-' + index);
            const diskUsage = parseFloat(diskDetails.percent);
            const textDISKS = document.getElementById('disk-progress-text' + index);

            if (diskUsage >= 0 && diskUsage <= 30) {
                diskBar.style.paddingLeft = '30px';
                diskBar.style.width = diskUsage + '%';
                textDISKS.textContent = diskUsage + '%';
                textDISKS.style.color = 'green';
                diskBar.style.backgroundColor = "green";

            } else if (diskUsage > 30 && diskUsage <= 50) {
                textDISKS.style.display = 'none';
                diskBar.style.width = diskUsage + '%';
                diskBar.innerHTML = diskUsage + '%';
                diskBar.style.backgroundColor = "green";
            } else if (diskUsage > 50 && diskUsage <= 79) {
                textDISKS.style.display = 'none';
                diskBar.style.width = diskUsage + '%';
                diskBar.innerHTML = diskUsage + '%';
                diskBar.style.backgroundColor = "orange";
            } else {
                textDISKS.style.display = 'none';
                diskBar.style.width = diskUsage + '%';
                diskBar.innerHTML = diskUsage + '%';
                diskBar.style.backgroundColor = "red";
                if (!discosNotificados.has(diskDetails.device)) {
                    discosNotificados.add(diskDetails.device);
                    discosCriticos.push(diskDetails.device);
                }
            }
        });
        if (discosCriticos.length > 0) {
            setTimeout(() => {
                notificacionDetalle("Las siguientes discos están llegando al límite de su capacidad:<br><strong>[ " + discosCriticos.join(' ] [ ') + " ]</strong>");
            }, 2000);
        }
        // GRÁFICO DINÁMICO:
        const cpuValue = parseFloat(dataCPU.usage);
        const ramValue = parseFloat(dataRAM.percent);

        // Sumar todos los porcentajes de discos
        let totalDiskPercent = 0;
        if (Array.isArray(dataDisk.disks)) {
            dataDisk.disks.forEach(d => {
                totalDiskPercent += parseFloat(d.percent);
            });
            totalDiskPercent = Math.round(totalDiskPercent / dataDisk.disks.length); // Promedio si hay más de un disco
        }

        // Actualiza el gráfico de monitoreo
        if (chartGlobal) {
            chartGlobal.data.datasets[0].data = [cpuValue, ramValue, totalDiskPercent];
            chartGlobal.update();
        }

    } catch (error) {
        console.log('Error al cargar datos de Monitoreo: ', error);
    }
}

const ctxDoughnut = document.getElementById('donutsTickets');
Chart.register(ChartDataLabels);
chartGlobal = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
        labels: ['CPU', 'MEMORIA', 'DISCO'],
        datasets: [{
            label: 'En uso (%)',
            data: [0, 0, 0], // Los valores reales de los segmentos
            backgroundColor: [
                'rgb(27, 12, 92)',
                'rgb(54, 162, 235)',
                'rgb(31, 148, 171)'
            ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: false, // No ajusta el tamaño automáticamente
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'white',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            datalabels: {
                display: true,
                color: 'white',
                formatter: (value) => `${value}%`,
                align: 'center',
                anchor: 'center'
            }
        }
    }
});
$(document).ready(function () {

});

