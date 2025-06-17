const ctxBarra = document.getElementById('barraAtenciones');
const labels = ['Ica', 'Lima', 'Arequipa', 'Piura'];
let mapTech;
let markersTechAsig = [];
let markersTechDisp = [];
let chart;
let chartService;
let chartUbicaciones;
let colorIndex = 0;
document.addEventListener('DOMContentLoaded', function () {
    // barra de progreso:
    const spanProgreso = document.querySelector('.progress-bar span');
    const textoRestante = document.querySelector('.progress-bar .restante');

    if (spanProgreso && textoRestante) {
        const final = parseInt(spanProgreso.dataset.width.replace('%', '')) || 0;
        const restante = 100 - final;

        spanProgreso.style.width = final + '%';
        spanProgreso.textContent = final + '% (D)';
        if (restante > 20) {
            textoRestante.textContent = restante + '%';
        }
    }
    conteoTech();
    initializeDashboard();
    initMap();
});
// Inicializar el mapa
function initMap() {
    mapTech = L.map('mapaTech').setView([-14.07, -75.73], 13); // Centro inicial aproximado

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapTech);
}
// Añadir marcadores al mapa
function mostrarTecnicosEnMapa(listaTechDisp = [], listaTechAsig = []) {
    markersTechAsig.forEach(m => mapTech.removeLayer(m));
    markersTechDisp.forEach(m => mapTech.removeLayer(m));
    markersTechAsig = [];
    markersTechDisp = [];

    let lat, lng;
    // Icono azul para técnicos disponibles
    const iconTechDisp = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Icono verde para técnicos asignados
    const iconTechAsig = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    listaTechDisp.forEach(tech => {
        lat = parseFloat(tech['latitude']);
        lng = parseFloat(tech['longitude']);

        if (!isNaN(lat) && !isNaN(lng)) {
            const markerDisp = L.marker([lat, lng], { icon: iconTechDisp })
                .addTo(mapTech)
                .bindPopup(`<strong>${tech.full_name}</strong>`);
            markersTechDisp.push(markerDisp);
        }
    });

    listaTechAsig.forEach(tech => {
        lat = parseFloat(tech['latitude']);
        lng = parseFloat(tech['longitude']);

        if (!isNaN(lat) && !isNaN(lng)) {
            const markerAsig = L.marker([lat, lng], { icon: iconTechAsig })
                .addTo(mapTech)
                .bindPopup(`<strong>${tech.full_name}</strong>`);
            markersTechAsig.push(markerAsig);
        }
    });
 
    // Mover el mapa si hay solo uno
    if ((listaTechAsig.length === 1 && !isNaN(lat) && !isNaN(lng)) ||
        (listaTechDisp.length === 1 && !isNaN(lat) && !isNaN(lng))) {
        mapTech.setView([lat, lng], 15); // Zoom cercano
    }

    // Ajustar el mapa para mostrar todos los marcadores
    if (markersTechAsig.length > 1 || markersTechDisp.length > 1) {
        const markersTech = [...markersTechAsig, ...markersTechDisp];
        const group = new L.featureGroup(markersTech);
        mapTech.fitBounds(group.getBounds());
    }
}

async function conteoTech() {
    const responseTech = await fetch('/dashboard/tecnicos/conteo/');
    const dataTech = await responseTech.json();
    const techDisp = document.getElementById('techDisp');
    const techAsig = document.getElementById('techAsig');
    techDisp.textContent = `${dataTech.tech_Disp}`;
    techAsig.textContent = `${dataTech.tech_Asig}`;
}
// Listar años
function listYear() {
    const yearSelect = document.getElementById('listYear');
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement('option');
        option.classList.add("list");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Listar técnicos y manejar selección
async function listTech() {
    const responseListTech = await fetch('/dashboard/tecnicos/listar/');
    const dataListTech = await responseListTech.json();
    const optionTech = document.getElementById('listTech');
    optionTech.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.classList.add("list");
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los Técnicos';
    optionTech.appendChild(defaultOption);

    dataListTech.listaTech.forEach(tech => {
        const option = document.createElement('option');
        option.classList.add("list");
        option.value = tech.id;
        option.textContent = tech.username;
        optionTech.appendChild(option);
    });
    mostrarTecnicosEnMapa(dataListTech.coord_tech_disp, dataListTech.coord_tech_Asig);
    optionTech.addEventListener('change', function () {
        const selectedTechId = this.value || null;
        const selectedYear = document.getElementById('listYear').value || new Date().getFullYear();
        conteoTickets(selectedTechId, selectedYear);

        // Filtrar técnicos según la selección
        const filteredDisp = selectedTechId
            ? dataListTech.coord_tech_disp.filter(tech => tech.user_id == selectedTechId)
            : dataListTech.coord_tech_disp;

        const filteredAsig = selectedTechId
            ? dataListTech.coord_tech_Asig.filter(tech => tech.user_id == selectedTechId)
            : dataListTech.coord_tech_Asig;

        mostrarTecnicosEnMapa(filteredDisp, filteredAsig);
    });
}

// Mostrar conteo de tickets correspondientes a un técnico y año específico
async function conteoTickets(id = null, year = new Date().getFullYear()) {
    let url = `/dashboard/tickets/conteo/${year}/`;
    if (id) {
        url += `${id}/`;
    }

    const responseTickets = await fetch(url);
    const dataTickets = await responseTickets.json();
    // Conteo tickets de clientes y total clientes
    const ticketClienteElement = document.getElementById('ticketClient');
    const countClientElement = document.getElementById('cantClient');
    ticketClienteElement.textContent = `${dataTickets.count_ticketsTotal}`;
    countClientElement.textContent = `${dataTickets.count_clientes}`;

    // Actualizar datos de gráficos donuts
    const ticketsResueltos = dataTickets.count_resuelto;
    const ticketsProceso = dataTickets.count_progreso;
    const ticketsPendientes = dataTickets.count_pendiente;

    charts.forEach(chart => {
        chart.data.datasets[0].data = [ticketsResueltos, ticketsProceso, ticketsPendientes];
        chart.update();
    });

    // Actualizar datos de gráficos de servicios
    const meses = dataTickets.service_complete.map(item => item.mes);
    const conteos = dataTickets.service_complete.map(item => item.total);

    chartsService.forEach(chartService => {
        chartService.data.labels = meses; // Los nombres de los meses como etiquetas
        chartService.data.datasets[0].data = conteos; // Los totales como datos
        chartService.update();
    });
}

// Inicializar todo
async function initializeDashboard() {
    listYear();
    await listTech();

    // Llamar conteo inicial con valores actuales
    const year = document.getElementById('listYear').value || new Date().getFullYear();
    conteoTickets(null, year);

    // Evento: cambio de año
    document.getElementById('listYear').addEventListener('change', () => {
        const selectedTechId = document.getElementById('listTech').value || null;
        const selectedYear = document.getElementById('listYear').value;
        conteoTickets(selectedTechId, selectedYear);
    });
}
// Gráficos para Tickets
const donutCanvases = document.querySelectorAll('.donutsTickets');
const charts = [];

// Crear gráficos de dona para cada canvas encontrado
donutCanvases.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d');

    const isResponsive = !canvas.classList.contains('noResponsive');

    const options = {
        responsive: isResponsive,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: isResponsive ? 'right' : 'right',
                labels: {
                    color: 'white',
                    font: {
                        size: 20
                    },
                    generateLabels: function (chart) { //para la leyenda personalizada
                        const data = chart.data;
                        return data.labels.map((label, i) => {
                            const value = data.datasets[0].data[i];
                            const backgroundColor = data.datasets[0].backgroundColor[i];
                            return {
                                text: `${label}: ${value}`,
                                fillStyle: backgroundColor,
                                strokeStyle: backgroundColor,
                                index: i,
                                fontColor: 'white',
                                color: 'white',
                            };
                        });
                    }
                }
            },
            tooltip: {
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: '#333'
            }
        }
    };

    const chartDonuts = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Resuelto', 'Proceso', 'Pendiente'],
            datasets: [{
                label: 'Tickets',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgb(27, 12, 92)',
                    'rgb(54, 162, 235)',
                    'rgb(31, 148, 171)'
                ],
                hoverOffset: 4
            }]
        },
        options: options
    });

    charts.push(chartDonuts);
});

function changeColors() {
    // Cambiar colores dinámicamente cada 2 segundos
    const colors = [
        ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(31, 148, 171)'],
        ['rgb(255, 159, 64)', 'rgb(153, 102, 255)', 'rgb(75, 192, 192)'],
        ['rgb(255, 205, 86)', 'rgb(54, 235, 162)', 'rgb(191, 99, 132)'],
    ];

    charts.forEach(chart => {
        chart.data.datasets[0].backgroundColor = colors[colorIndex];
        chart.update();
    });
    colorIndex = (colorIndex + 1) % colors.length;
}

setInterval(changeColors, 2000);

//Gráfico de servicios completados:
const linealCanvas = document.querySelectorAll('.linealServicios');
const chartsService = [];

linealCanvas.forEach((canvas, index) => {
    const ctx = canvas.getContext('2d');
    const isResponsive = !canvas.classList.contains('noResponsive');
    const options = {
        responsive: isResponsive,
        scales: {
            x: {
                ticks: {
                    color: 'white' // Eje X
                }
            },
            y: {
                ticks: {
                    color: 'white' // Eje Y
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            },
            tooltip: {
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: '#333'
            }
        }
    }
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cantidad por mes',
                data: [0, 0, 0],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: options
    });

    chartsService.push(chart);
});

new Chart(ctxBarra, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            axis: 'y',
            label: 'Departamentos',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(201, 203, 207, 0.2)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        indexAxis: 'y',
        scales: {
            x: {
                ticks: {
                    color: 'white' // Eje X
                }
            },
            y: {
                ticks: {
                    color: 'white' // Eje Y
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            },
            tooltip: {
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: '#333'
            }
        }
    }
})

//MODALS:
//MODAL TICKET:
const modalTickets = document.getElementById('modalTicket');
const openModalTickets = document.getElementById('btnTicketsEstado');
const closeModalTickets = document.getElementById('closeModalTicket');
openModalTickets.addEventListener('click', function () {
    modalTickets.style.display = 'flex';
});

closeModalTickets.addEventListener('click', function () {
    modalTickets.style.display = 'none';
});

// Cerrar el modal si se hace clic fuera del contenido del modal 
window.addEventListener('click', function (event) {
    if (event.target == modalTickets) {
        modalTickets.style.display = 'none';
    }
});
//MODAL SERVICIOS:
const modalServicios = document.getElementById('modalService');
const openModalServicios = document.getElementById('btnServiceInf');
const closeModalServicios = document.getElementById('closeModalService');
openModalServicios.addEventListener('click', function () {
    modalServicios.style.display = 'flex';
});
closeModalServicios.addEventListener('click', function () {
    modalServicios.style.display = 'none';
});

window.addEventListener('click', function (event) {
    if (event.target == modalServicios) {
        modalServicios.style.display = 'none';
    }
});