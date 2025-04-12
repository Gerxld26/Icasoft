let chartGlobal;
let modalOpen = false;
let intervalId;

$(document).ready(function () {
    /*MONITOREO*/
    const modalMonitoreo = document.getElementById('modalMonitoreo');
    const openModalMonitoreo = document.getElementById('btnMonitoreo');
    const closeModalbtn = document.getElementById('closeModal');
    const btnMonitoreoFunction = document.getElementById('btnMonitoreioAnalisis');
    const imgGrafico = document.getElementById('imgGraficoMonitoreo');
    const progressBar = document.getElementById('progressBarMonitoreo');

    // Función que obtiene los datos de RAM y actualiza el progreso
    async function fetchCpuData() {
        try {

            const responseCPU = await fetch('/dashboard/client/monitoring/cpu/data/');
            const responseRAM = await fetch('/dashboard/client/monitoring/ram/data/'); //la ruta se definió en el views  client_monitoring_ram_data
            const responseDISK = await fetch('/dashboard/client/monitoring/disk/data');

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


            if (parseInt(dataCPU.usage) >= 0 && parseInt(dataCPU.usage) <= 15) {
                //CPU
                spanCPU.style.width = dataCPU.usage + '%'; //el ancho de lo pintado
                spanCPU.style.paddingLeft = '30px';
                textCPU.textContent = dataCPU.usage + '%';
                textCPU.style.color = 'green';
                spanCPU.style.backgroundColor = "green";

            } else if (parseInt(dataCPU.usage) > 15 && parseInt(dataCPU.usage) <= 50) {
                //CPU
                spanCPU.style.width = dataCPU.usage + '%';
                spanCPU.innerHTML = dataCPU.usage + '%';
                spanCPU.style.backgroundColor = "green";
            } else if (parseInt(dataCPU.usage) > 50 && parseInt(dataCPU.usage) <= 79) {
                //CPU
                spanCPU.style.width = dataCPU.usage + '%';
                spanCPU.innerHTML = dataCPU.usage + '%';
                spanCPU.style.backgroundColor = "orange";
            } else {
                //CPU
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
            }

            //DISCOS
            var textDisk = '';
            const datosDiscos = dataDisk.disks;

            datosDiscos.forEach((diskDetails, index) => {
                textDisk += '<div class="textContentHW disco-nombre">' + diskDetails.device + ' - En uso: ' + diskDetails.used + '</div>';
                textDisk += '<div class="progress-bar-Monitoreo">';
                textDisk += '<span class="disco-bar" id="disco-bar-' + index + '" data-width="0%"></span>';
                textDisk += '<div class="progress-text" id="disk-progress-text' + index + '">0%</div>';
                textDisk += '</div>';
            });
            $("#contentDisco").html(textDisk);

            datosDiscos.forEach((diskDetails, index) => {
                const diskBar = document.getElementById('disco-bar-' + index);
                const diskUsage = parseFloat(diskDetails.percent);
                const textDISKS = document.getElementById('disk-progress-text' + index);

                if (diskUsage >= 0 && diskUsage <= 15) {
                    diskBar.style.paddingLeft = '30px';
                    diskBar.style.width = diskUsage + '%';
                    textDISKS.textContent = diskUsage + '%';
                    textDISKS.style.color = 'green';
                    diskBar.style.backgroundColor = "green";

                } else if (diskUsage > 15 && diskUsage <= 50) {
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
                }
            });

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
            if (errorMessage) errorMessage.style.display = 'none';
        } catch (error) {
            if (errorMessage) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = "Error al cargar datos de la RAM. Reintentando...";
            }
        }
    }

    btnMonitoreoFunction.addEventListener('click', function () {
        modalOpen = true;
        /*MODAL MONITOREO*/
        openModalMonitoreo.addEventListener('click', function () {
            modalMonitoreo.style.display = 'flex';
            modalOpen = true;
            fetchCpuData();
            intervalId = setInterval(fetchCpuData, 5000);
        });
        fetchCpuData();

        imgGrafico.style.animation = "rotarImg 1.5s linear infinite";
        progressBar.style.display = 'flex';
    });

    closeModalbtn.addEventListener('click', function () {
        modalMonitoreo.style.display = 'none';
        modalOpen = false;
        imgGrafico.style.animation = "none";
        clearInterval(intervalId);
        imgGrafico.style.animation = "rotarImg 1.5s linear infinite";
    });
    // Cerrar el modal si se hace clic fuera del contenido del modal 
    window.addEventListener('click', function (event) {
        if (event.target == modalMonitoreo) {
            modalMonitoreo.style.display = 'none';
            modalOpen = false;
            imgGrafico.style.animation = "rotarImg 1.5s linear infinite";
            clearInterval(intervalId);
        }
    });

    const ctxDoughnut = document.getElementById('donutsTickets');
    chartGlobal = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['CPU', 'MEMORIA', 'DISCO'],
            datasets: [{
                label: 'En uso ',
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
                    formatter: (value) => {
                        return `${value}%`; 
                    },
                    align: 'center',
                    anchor: 'center'
                }
            }
        }
    });
});