const ctxDoughnut = document.getElementById('donutsTickets');
const ctxBarra = document.getElementById('barraAtenciones');
const ctxLineal = document.getElementById('linealServicios');
const labels = ['Ica', 'Lima', 'Arequipa', 'Piura'];

/*primer gráfico de los tickets*/
const chart = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
        labels: ['Red', 'Blue', 'Yellow'],
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
        responsive: true,
        plugins: {
            legend: {
                position: 'right'
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
    }
})