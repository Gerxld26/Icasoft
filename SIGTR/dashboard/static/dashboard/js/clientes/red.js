const modalRed = document.getElementById('modalRed');
const openModalRed = document.getElementById('btnRed');
const closeModalRed = document.getElementById('closeModalRed');

/* MODAL CENTRO DE Red */
openModalRed.addEventListener('click', function () {
    modalRed.style.display = 'flex';
});

closeModalRed.addEventListener('click', function () {    
    modalRed.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if(event.target == modalRed){
        modalRed.style.display = 'none';
    }
})
const ctx = document.getElementById('gaugeContainer');
const value = 75; // valor actual
const max = 100;

new Chart(ctx, {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [value, max - value],
      backgroundColor: ['#4caf50', '#e0e0e0'], // verde y gris
      borderWidth: 0,
      cutout: '80%',
      rotation: -90,
      circumference: 180
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      // Texto personalizado al centro
      title: {
        display: true,
        text: `${value}%`,
        font: { size: 24 },
        color: '#333',
        padding: { top: 20, bottom: 0 }
      }
    }
  }
});