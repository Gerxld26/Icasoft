const actionUrls = window.ACTION_URLS = {
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
    const contenedorMant = document.getElementById('cardMantenimiento');
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
        Swal.fire({
            icon: icono,
            title: titulo,
            html: mensaje,
            showConfirmButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    } else if (tipo === 'error') {
        icono = 'error';
        titulo = 'Error';
        Swal.fire({
            icon: icono,
            title: titulo,
            html: mensaje,
            showConfirmButton: true,
        })
    } else if (tipo === 'warning') {
        icono = 'warning';
        titulo = 'Advertencia';
        Swal.fire({
            icon: icono,
            title: titulo,
            html: mensaje,
            showConfirmButton: true,
        })
    } else if (tipo == 'info') {
        icono = 'info';
        titulo = 'Información';
        Swal.fire({
            icon: icono,
            title: titulo,
            html: mensaje,
            showConfirmButton: true,
        })
    }
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
async function eliminarDownland(boton) {
    limpiarContador();
    mostrarCargando(boton, true);

    try {
        const response = await fetch(actionUrls['cleanup'], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ include_downloads: true })
        });

        if (!response.ok) throw new Error(`Error del servidor (HTTP ${response.status})`);

        const data = await response.json();
        manejarEstadoRespuesta(data);
    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`${error.message || "No se pudo ejecutar la acción."}`, 'error');
    } finally {
        mostrarCargando(boton, false);
    }
}

async function eliminarArchivos(boton) {
    limpiarContador();
    mostrarCargando(boton, true);

    try {
        const response = await fetch(actionUrls['cleanup'], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ include_downloads: false })
        });

        if (!response.ok) throw new Error(`Error del servidor (HTTP ${response.status})`);

        const data = await response.json();
        manejarEstadoRespuesta(data);
    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`${error.message || "No se pudo ejecutar la acción."}`, 'error');
    } finally {
        mostrarCargando(boton, false);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', function () {
            const modalDowland = document.getElementById('modalDownland')
            modalDowland.style.display = 'flex';
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