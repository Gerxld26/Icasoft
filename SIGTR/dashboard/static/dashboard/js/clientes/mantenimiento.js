const actionUrls = window.ACTION_URLS = {
    getcache: "/dashboard/client/get-temp-size/",  // Cambiado para obtener solo información sin limpiar
    cleanup: "/dashboard/client/clear-space/",
    update: "/dashboard/client/maintenance/update-software/",
    defrag: "/dashboard/client/maintenance/defragment-disk/",
    repair: "/dashboard/client/maintenance/repair-disk/"
};

const modalMantenimiento = document.getElementById('modalMantenimiento');
const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
const closeModalMantenimiento = document.getElementById('closeModalMant');
const progressBarMantenimiento = document.getElementById('progressBarMantenimiento');
const spanMant = progressBarMantenimiento.querySelector('span');
const imgMant = document.getElementById('imgMant');
const imgMantGIF = document.getElementById('imgMantGIF');

const btnLiberarEspacio = document.querySelector('#cardData1 .btnCardDataFunction');
const btnActualizarSoftware = document.querySelector('#cardData2 .btnCardDataFunction');
const btnDesfragmentar = document.querySelector('#cardData3 .btnCardDataFunction');
const btnReparar = document.querySelector('#cardData4 .btnCardDataFunction');
let resultadoMantenimiento = document.getElementById('mantenimientoResultado');
let contadorIntervalo = null;

function MantenimientoFunction() {
    openModalMantenimiento.style.pointerEvents = 'none';
    spanMant.style.width = '0%';
    spanMant.textContent = '0%';
    const porcentajeFinal = parseInt(spanMant.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del mantenimiento', 5);

    animarProgreso(spanMant, porcentajeFinal, () => {
        setTimeout(() => {
            modalMantenimiento.style.display = 'flex';
            modalMantenimiento.style.fontSize = '18px';
            openModalMantenimiento.style.pointerEvents = 'auto';
        }, 3000);
    }, typeNotification);
}

openModalMantenimiento.style.cursor = 'pointer';
openModalMantenimiento.addEventListener('click', function () {
    deshabilitarBotones('mantenimiento');
    modalOpen = true;
    const contenedorMant = document.querySelector(".ultMant");
    contenedorMant.classList.add("borde-animado");
    if (btnPressAnalisis) {
        modalMantenimiento.style.display = 'flex';
    } else {
        MantenimientoFunction();
    }
    openModalMantenimiento.style.fontSize = '18px';
    imgMant.style.display = 'none';
    imgMantGIF.style.display = 'flex';
    progressBarMantenimiento.style.display = 'flex';
})

closeModalMantenimiento.addEventListener('click', function () {
    limpiarContador();
    modalMantenimiento.style.display = 'none';
    modalOpen = false;
    habilitarBotones('mantenimiento');
})

window.addEventListener('click', function (event) {
    if (event.target == modalMantenimiento) {
        limpiarContador();
        modalMantenimiento.style.display = 'none';
        modalOpen = false;
        habilitarBotones('mantenimiento');
    }
});

function mostrarResultado(mensaje, tipo = 'info') {
    let icono = 'success';
    let titulo = 'Éxito';
    if (tipo === 'success') {
        icono = 'success';
        titulo = 'Éxito';
    } else if (tipo === 'error') {
        icono = 'error';
        titulo = 'Error';
    } else if (tipo === 'warning') {
        icono = 'warning';
        titulo = 'Advertencia';
    } else if (tipo == 'info'){
        icono = 'info';
        titulo = 'Información';
    }
    Swal.fire({
        icon: `${icono}`,
        title: `${titulo}`,
        html: `${mensaje}`,
        showConfirmButton: true,
    })
}

function limpiarContador() {
    if (contadorIntervalo) {
        clearInterval(contadorIntervalo);
        contadorIntervalo = null;
    }
}

function mostrarCargando(boton, cargando = true) {
    if (!boton) return;

    if (cargando) {
        boton.dataset.originalText = boton.innerHTML;
        boton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
        boton.disabled = true;
        boton.style.opacity = '0.7';
    } else {
        if (boton.dataset.originalText) {
            boton.innerHTML = boton.dataset.originalText;
        }
        boton.disabled = false;
        boton.style.opacity = '1';
    }
}

function manejarEstadoRespuesta(data) {
    limpiarContador();

    switch (data.status) {
        case 'in_progress':
            mostrarResultado(`
                <div class="progress-indicator">
                    <div class="spinner"></div>
                    <p>Operación en curso. Por favor, espera un momento...</p>
                    <p class="countdown">Tiempo transcurrido: <span id="tiempo-transcurrido">0</span> segundos</p>
                </div>
            `, 'warning');

            let segundos = 0;
            contadorIntervalo = setInterval(() => {
                segundos++;
                const tiempoElement = document.getElementById('tiempo-transcurrido');
                if (tiempoElement) {
                    tiempoElement.textContent = segundos;
                }

                if (segundos >= 30) {
                    clearInterval(contadorIntervalo);
                    contadorIntervalo = null;
                    mostrarResultado(`
                        <p><i class="fas fa-info-circle text-warning"></i> La operación está tomando más tiempo de lo esperado.</p>
                        <p>Puedes continuar usando el sistema mientras se completa en segundo plano.</p>
                        <p>Los resultados se actualizarán automáticamente cuando estén disponibles.</p>
                    `, 'warning');
                }
            }, 1000);
            break;

        case 'scheduled':
            mostrarResultado(`
                <div>
                    <p><i class="fas fa-clock text-warning"></i> <strong>Operación programada para el próximo reinicio</strong></p>
                    <p>Esta operación requiere reiniciar el equipo para completarse.</p>
                    <p>Por favor, guarda tu trabajo y reinicia el sistema cuando sea conveniente.</p>
                    <button id="btn-recordatorio" class="btn btn-sm btn-outline-warning mt-2">Recordármelo más tarde</button>
                </div>
            `, 'warning');

            setTimeout(() => {
                const btnRecordatorio = document.getElementById('btn-recordatorio');
                if (btnRecordatorio) {
                    btnRecordatorio.addEventListener('click', () => {
                        alert('Se te recordará sobre esta tarea pendiente en 1 hora.');
                        mostrarResultado(`
                            <p><i class="fas fa-bell text-info"></i> <strong>Recordatorio programado</strong></p>
                            <p>Se te recordará sobre la operación pendiente en 1 hora.</p>
                            <p>Puedes cerrar esta ventana y continuar trabajando.</p>
                        `, 'info');
                    });
                }
            }, 100);
            break;

        case 'success':
            mostrarResultado(`${data.message}`, 'success');
            break;
        case 'info':
            mostrarResultado(`${data.message}`, 'info');
        break;
        case 'error':
        default:
            mostrarResultado(`${data.message || "Error desconocido"}`, 'error');
            break;
    }
}

async function ejecutarAccion(accion, boton) {
    limpiarContador();
    mostrarCargando(boton, true);

    const url = actionUrls[accion];
    if (!url) {
        console.error(`URL no encontrada para la acción: ${accion}`);
        mostrarResultado(`Acción no válida o no configurada.`, 'error');
        mostrarCargando(boton, false);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Error del servidor (HTTP ${response.status})`);
        }

        const data = await response.json();

        manejarEstadoRespuesta(data);

    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`${error.message || "No se pudo ejecutar la acción."}`, 'error');
    } finally {
        mostrarCargando(boton, false);
    }
}

async function getSizeInfo() {
    try {
        const archTemp = document.getElementById('archTemp');
        const archUso = document.getElementById('archUso');
        
        // Verificar si los elementos existen
        if (!archTemp || !archUso) {
            console.error('Elementos archTemp o archUso no encontrados');
            return;
        }

        // Establecer valores mientras se carga
        archTemp.textContent = "Archivos temporales: Cargando...";
        archUso.textContent = "Archivos en uso: Cargando...";

        // Usar la URL directa para obtener el tamaño
        const response = await fetch('/dashboard/client/get-temp-size/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`Error del servidor (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log("Respuesta del servidor:", data); // Para depuración

        // Asegurarse de que tengamos los campos correctos del servidor
        if (data && (data.total_temp_size || data.total_scanned_size)) {
            const tempSize = data.total_temp_size || data.total_scanned_size;
            archTemp.textContent = `Archivos temporales: ${tempSize}`;
        } else {
            archTemp.textContent = "Archivos temporales: No disponible";
            console.warn("Formato de respuesta inesperado:", data);
        }
        
        if (data && (data.files_in_use_count || data.files_in_use)) {
            const filesInUse = data.files_in_use_count || data.files_in_use;
            archUso.textContent = `Archivos en uso: ${filesInUse}`;
        } else {
            archUso.textContent = "Archivos en uso: No disponible";
        }
    } catch (error) {
        console.error('Error al obtener información de archivos temporales:', error);
        
        const archTemp = document.getElementById('archTemp');
        const archUso = document.getElementById('archUso');
        
        if (archTemp) archTemp.textContent = "Archivos temporales: Error de conexión";
        if (archUso) archUso.textContent = "Archivos en uso: Error de conexión";
    } 
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', function () {
    getSizeInfo();

    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', function () {
            ejecutarAccion('cleanup', this);
        });
    }

    if (btnActualizarSoftware) {
        btnActualizarSoftware.addEventListener('click', function () {
            ejecutarAccion('update', this);
        });
    }

    if (btnDesfragmentar) {
        btnDesfragmentar.addEventListener('click', function () {
            ejecutarAccion('defrag', this);
        });
    }

    if (btnReparar) {
        btnReparar.addEventListener('click', function () {
            ejecutarAccion('repair', this);
        });
    }
});