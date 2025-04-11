/*MONITOREO*/
let modalOpen = false;
let intervalId;
const modalMonitoreo = document.getElementById('modalMonitoreo');
const openModalMonitoreo = document.getElementById('btnMonitoreo');
const closeModalbtn = document.getElementById('closeModal');
const btnMonitoreoFunction = document.getElementById('btnMonitoreioAnalisis');
const imgGrafico = document.getElementById('imgGraficoMonitoreo');
const progressBar = document.getElementById('progressBarMonitoreo');

// Función que obtiene los datos de RAM y actualiza el progreso
async function fetchCpuData() {
    try {
        const responseRAM = await fetch('/dashboard/client/monitoring/ram/data/'); //la ruta se definió en el views  client_monitoring_ram_data
        const responseCPU = await fetch('/dashboard/client/monitoring/cpu/data/');

        if (!responseRAM.ok) throw new Error("Error al obtener datos del servidor de la RAM.");
        if (!responseCPU.ok) throw new Error("Error al obtener datos del servidor de la CPU.");
        const dataRAM = await responseRAM.json();

        // Actualizar la barra de progreso de RAM
        const progressBarRAM = document.getElementById('progress-bar-ram');
        const spanRAM = progressBarRAM.querySelector('span');

        const sistemaOperativoText = document.getElementById('sistemaOperativotext');
        sistemaOperativoText.textContent = `En uso: ${dataRAM.used} GB`; // Muestra la RAM usada

        if (parseInt(dataRAM.percent) >= 0 && parseInt(dataRAM.percent) <= 50) {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "green"; // Verde
        } else if (parseInt(dataRAM.percent) > 50 && parseInt(dataRAM.percent) <= 79) {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "orange"; // Naranja
        } else {
            spanRAM.style.width = dataRAM.percent + '%';
            spanRAM.innerHTML = dataRAM.percent + '%';
            spanRAM.style.backgroundColor = "red"; // Rojo
        }

        if (errorMessage) errorMessage.style.display = 'none';
    } catch (error) {
        console.error("Error al obtener datos de la RAM:", error);
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
const chart = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
        labels: ['CPU', 'MEMORIA', 'DISCO'],
        datasets: [{
            label: 'Rendimiento de Hardware',
            data: [300, 50, 100], // Los valores reales de los segmentos
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
                position: 'right'
            },
            datalabels: {
                display: true,  // Asegúrate de que la propiedad `display` está activada
                color: 'white',
                formatter: (value) => {
                    return value; // Muestra el valor real en cada segmento
                },
                font: { weight: 'bold', size: 16 },
                align: 'center',
                anchor: 'center'
            }
        }
    }
});
