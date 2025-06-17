const modalHistorial = document.getElementById('modalHistorial');
const openModalHistorial = document.getElementById('btnHist');
const closeModalHistorial = document.getElementById('closeModalHist');
const progressBarHistorial = document.getElementById('progressBarHistorial');
const contenidoHistorialElement = document.getElementById('contenidoHistorial');
const imgHist = document.getElementById('imgHistDet');
const spanHistorial = progressBarHistorial.querySelector('span');
modalHistorial.classList.add('modal-hidden');

function HistorialFunction() {
    openModalHistorial.style.pointerEvents = 'none';
    spanHistorial.style.width = '0%';
    spanHistorial.textContent = '0%';
    const porcentajeFinal = parseInt(spanHistorial.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del historial', 6);

    animarProgreso(spanHistorial, porcentajeFinal, () => {
        setTimeout(() => {
            openModalHistorial.style.pointerEvents = 'auto';
            modalHistorial.style.display = 'flex';
            modalHistorial.style.fontSize = '18px';
        }, 3000);
    }, typeNotification);
}
openModalHistorial.style.cursor = 'pointer';
openModalHistorial.addEventListener('click', function () {
    deshabilitarBotones('historial');
    modalOpen = true;
    const contenedorHis = document.getElementById("cardHistorial");
    contenedorHis.classList.add("borde-animado");
    obtenerHistorial(); 
    if (btnPressAnalisis) { 
        modalHistorial.style.display = 'flex';
    } else {
        HistorialFunction();
    }
    imgHist.style.height = '70px';
    progressBarHistorial.style.display = 'flex';

});

closeModalHistorial.addEventListener('click', function () {
    modalHistorial.style.display = 'none';
    modalOpen = false;
    habilitarBotones('historial');
});

window.addEventListener('click', function (event) {
    if (event.target == modalHistorial) {
        modalHistorial.style.display = 'none';
        modalOpen = false;
        habilitarBotones('historial');
    }
});

function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function obtenerHistorial() {
    try {
        const response = await fetch('/dashboard/client/historial/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Error al obtener el historial');
        }

        const data = await response.json();
        console.log('historial: ', data);
        if (data.status === 'success') {
            contenidoHistorialElement.innerHTML = '';

            const tablaHistorial = document.createElement('table');
            tablaHistorial.className = 'tabla-historial';

            const encabezados = `
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>CPU</th>
                            <th>RAM</th>
                            <th>Disco</th>
                        </tr>
                    </thead>
                `;
            tablaHistorial.innerHTML = encabezados;

            const tbody = document.createElement('tbody');
            data.historial.forEach((item, index) => {
                const fila = document.createElement('tr');
                fila.id = `hist-${index + 1}`;
                if (index === 0) {
                    fila.style.background = '#00ff034d';
                }
                fila.innerHTML = `
                    <td>${formatearFecha(item.timestamp)}</td>
                    <td>${item.cpu_usage}</td>
                    <td>${item.ram_percent}</td>
                    <td>${item.disk_percent}</td>
                `;
                tbody.appendChild(fila);
            });
            tablaHistorial.appendChild(tbody);
            contenidoHistorialElement.appendChild(tablaHistorial);
        } else {
            if (typeof window.mostrarNotificacion === 'function') {
                window.mostrarNotificacion('error', 'No se pudo obtener el historial', 3);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('error', 'Error al cargar el historial', 3);
        }
    }
}

