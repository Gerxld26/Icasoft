const ctxBarra = document.getElementById('barraAtenciones');
const ctxLineal = document.getElementById('linealServicios');
const labels = ['Ica', 'Lima', 'Arequipa', 'Piura'];
let chart;
$(function () {
    $('#fechaIntervalos').daterangepicker({
        opens: 'left',
        locale: {
            format: 'DD/MM/YYYY',
            separator: ' - ',
            applyLabel: 'Aplicar',
            cancelLabel: 'Cancelar',
            fromLabel: 'Desde',
            toLabel: 'Hasta',
            customRangeLabel: 'Personalizado',
            weekLabel: 'S',
            daysOfWeek: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            firstDay: 1
        }
    });
});

new Chart(ctxBarra, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            axis: 'y',
            label: 'My First Dataset',
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
new Chart(ctxLineal, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'My First Dataset',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        responsive: false,
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
    conteoTickets();
    listTech();
});
async function conteoTech() {
    const responseTech = await fetch('/dashboard/tecnicos/conteo/');
    const dataTech = await responseTech.json();
    const techDisp = document.getElementById('techDisp');
    const techAsig = document.getElementById('techAsig');
    techDisp.textContent = `${dataTech.tech_Disp}`;
    techAsig.textContent = `${dataTech.tech_Asig}`;
}
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
   
    dataListTech.listaTech.forEach(tech => { // ya que es un objeto lo que se retorna se especifica el nombre del objeto que es listaTech
        const option = document.createElement('option');
        option.classList.add("list");
        option.value = tech.id;
        option.textContent = tech.username;
        optionTech.appendChild(option);
    });
    optionTech.addEventListener('change', function () {
        const selectedTechId = this.value;
        if (selectedTechId) {
            conteoTickets(selectedTechId); // con id
        } else {
            conteoTickets(); // sin id
        }
    });

}
// Gráficos para Tickets
const donutCanvases = document.querySelectorAll('.donutsTickets');
const charts = [];

const donutData = {
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
};

const donutOptions = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                color: 'white',
                font: {
                    size: 20
                },
                generateLabels: function (chart) {
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
                    generateLabels: function (chart) {
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

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: JSON.parse(JSON.stringify(donutData)),
        options: options
    });

    charts.push(chart);
});

// Función para obtener los datos con respecto a los tickets y si se pasa id de técnico o no y actualizar gráfico ticket
async function conteoTickets(id = null) {
    let url = '/dashboard/tickets/conteo/';
    if (id) {
        url += `${id}/`;
    }
    const responseTickets = await fetch(url);
    const dataTickets = await responseTickets.json();

    //Conteo tickets de clientes y total clientes:
    const ticketCliente = dataTickets.count_ticketsTotal;
    const countClient = dataTickets.count_clientes;
    const ticketClienteElement = document.getElementById('ticketClient');
    const countClientElement = document.getElementById('cantClient');
    ticketClienteElement.textContent = `${ticketCliente}`;
    countClientElement.textContent = `${countClient}`;

    // Actualizar los datos de los gráficos de tickets
    const ticketsResueltos = dataTickets.count_resuelto;
    const ticketsProceso = dataTickets.count_progreso;
    const ticketsPendientes = dataTickets.count_pendiente;
    const ticketsTotal = ticketsResueltos + ticketsProceso + ticketsPendientes; //agregar luego
    // const ticketsTotalElement = document.getElementById('ticketsTotal');
    // ticketsTotalElement.textContent = `Total de Tickets: ${ticketsTotal}`;
    charts.forEach(chart => {
        chart.data.datasets[0].data = [ticketsResueltos, ticketsProceso, ticketsPendientes];
        chart.update();
    });
}

// Cambiar colores dinámicamente cada 2 segundos
let colorIndex = 0;
const colors = [
    ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(31, 148, 171)'],
    ['rgb(255, 159, 64)', 'rgb(153, 102, 255)', 'rgb(75, 192, 192)'],
    ['rgb(255, 205, 86)', 'rgb(54, 235, 162)', 'rgb(191, 99, 132)'],
];

function changeColors() {
    charts.forEach(chart => {
        chart.data.datasets[0].backgroundColor = colors[colorIndex];
        chart.update();
    });
    colorIndex = (colorIndex + 1) % colors.length;
}

setInterval(changeColors, 2000);

//MODALS:
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