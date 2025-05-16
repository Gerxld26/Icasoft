const ctxDoughnut = document.getElementById('donutsTickets');
const ctxBarra = document.getElementById('barraAtenciones');
const ctxLineal = document.getElementById('linealServicios');
const labels = ['Ica', 'Lima', 'Arequipa', 'Piura'];
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
/*primer gráfico de los tickets*/
const chart = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
        labels: ['Resuelto', 'Proceso', 'Pendiente'],
        datasets: [{
            label: 'My First Dataset',
            data: [300, 50, 100],
            backgroundColor: [
                'rgb(27, 12, 92)',
                'rgb(54, 162, 235)',
                'rgb(31, 148, 171)'
            ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: 'white' // Color del texto de la leyenda
                }
            },
            tooltip: {
                bodyColor: 'white',
                titleColor: 'white',
                backgroundColor: '#333'
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true
        }
    }
});

// Cambiar colores dinámicamente cada 2 segundos
let colorIndex = 0;
const colors = [
    ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(31, 148, 171)'], // Primer conjunto de colores
    ['rgb(255, 159, 64)', 'rgb(153, 102, 255)', 'rgb(75, 192, 192)'], // Segundo conjunto de colores
    ['rgb(255, 205, 86)', 'rgb(54, 235, 162)', 'rgb(191, 99, 132)'],
];

function changeColors() {
    // Cambiar el color de fondo del gráfico
    chart.data.datasets[0].backgroundColor = colors[colorIndex];
    colorIndex = (colorIndex + 1) % colors.length; // Cambiar el índice de color
    chart.update(); // Actualizar el gráfico
}

setInterval(changeColors, 2000); // Cambiar los colores cada 2 segundos

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
        if(restante > 20){
            textoRestante.textContent = restante + '%'; 
        }
    }
    
});
