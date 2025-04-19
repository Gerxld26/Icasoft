document.addEventListener('DOMContentLoaded', function() {
    const modalHistorial = document.getElementById('modalHistorial');
    const btnHistorialDerecho = document.getElementById('btnHist');
    const btnHistorialIzquierdo = document.getElementById('btnHistFunction');
    const closeModalHistorial = document.getElementById('closeModalHist');
    const progressBarHistorial = document.getElementById('progressBarHistorial');
    const contenidoHistorialElement = document.getElementById('contenidoHistorial');

    modalHistorial.classList.add('modal-hidden');

    closeModalHistorial.addEventListener('click', function() {
        modalHistorial.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modalHistorial) {
            modalHistorial.style.display = 'none';
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
                data.historial.forEach(item => {
                    const fila = document.createElement('tr');
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

                if (typeof window.mostrarNotificacion === 'function') {
                    window.mostrarNotificacion('success', 'Historial cargado exitosamente', 2);
                }
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

    function iniciarAnimacionBarraProgreso() {
        let progress = 0;
        const spanProgreso = progressBarHistorial.querySelector('span');
        
        const interval = setInterval(() => {
            progress += 2;
            spanProgreso.style.width = `${progress}%`;
            spanProgreso.textContent = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                obtenerHistorial();
            }
        }, 20);
    }

    btnHistorialIzquierdo.addEventListener('click', function() {
        iniciarAnimacionBarraProgreso();
    });

    btnHistorialDerecho.addEventListener('click', function() {
        if (progressBarHistorial.querySelector('span').style.width === '100%') {
            modalHistorial.style.display = 'flex';
        }
    });
});