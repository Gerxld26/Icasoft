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
