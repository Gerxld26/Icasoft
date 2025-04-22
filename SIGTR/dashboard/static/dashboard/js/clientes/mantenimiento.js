const actionUrls = window.ACTION_URLS = {
    cleanup: "/dashboard/client/maintenance/clear-space/",
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

// Referencias a los botones de acción de mantenimiento
const btnLiberarEspacio = document.querySelector('#cardData1 .btnCardDataFunction');
const btnActualizarSoftware = document.querySelector('#cardData2 .btnCardDataFunction');
const btnDesfragmentar = document.querySelector('#cardData3 .btnCardDataFunction');
const btnReparar = document.querySelector('#cardData4 .btnCardDataFunction');
let resultadoMantenimiento = document.getElementById('mantenimientoResultado');
let contadorIntervalo = null;

function MantenimientoFunction() {
    openModalMantenimiento.style.pointerEvents = 'none'; //evitar que el usuario haga click en el botón
    spanMant.style.width = '0%';
    spanMant.textContent = '0%';
    const porcentajeFinal = parseInt(spanMant.dataset.width.replace('%', ''));
    const typeNotification = () => mostrarNotificacion('success', 'Análisis completo del mantenimiento', 5);

    animarProgreso(spanMant, porcentajeFinal, () => {
        setTimeout(() => {
            modalMantenimiento.style.display = 'flex';
            modalMantenimiento.style.fontSize = '18px';
            openModalMantenimiento.style.pointerEvents = 'auto'; //reactivar el botón al terminar la animación
        }, 3000);
    }, typeNotification);
}
openModalMantenimiento.style.cursor = 'pointer';
openModalMantenimiento.addEventListener('click', function () {
    openModalMantenimiento.style.fontSize = '18px';
    imgMant.style.display = 'none';
    imgMantGIF.style.display = 'flex';
    progressBarMantenimiento.style.display = 'flex';
    MantenimientoFunction();
})

closeModalMantenimiento.addEventListener('click', function () {
    limpiarContador();

    modalMantenimiento.style.display = 'none';
})

window.addEventListener('click', function (event) {
    if (event.target == modalMantenimiento) {
        limpiarContador();
        modalMantenimiento.style.display = 'none';
    }
});

// Función para mostrar mensajes de resultado
function mostrarResultado(mensaje, tipo = 'info') {

    if (!resultadoMantenimiento) {
        resultadoMantenimiento = document.createElement('div');
        resultadoMantenimiento.id = 'mantenimientoResultado';
        resultadoMantenimiento.className = `resultado-${tipo}`;

        let icono = 'fas fa-info-circle';
        if (tipo === 'success') {
            icono = 'fas fa-check-circle';
        } else if (tipo === 'error') {
            icono = 'fas fa-exclamation-circle';
        } else if (tipo === 'warning') {
            icono = 'fas fa-exclamation-triangle';
        }
        resultadoMantenimiento.innerHTML = `
             <div id="iconResult"><i class="${icono}"></i></div>
            <div id="resultadoMensaje">${mensaje}</div>
        `;

        const contentData = document.querySelector('#modalMantenimiento .contentData');
        contentData.appendChild(resultadoMantenimiento);

    } else {
        resultadoMantenimiento.className = `resultado-${tipo}`;
        // Actualizar el icono
        let icono = 'fas fa-info-circle';
        if (tipo === 'success') {
            icono = 'fas fa-check-circle';
        } else if (tipo === 'error') {
            icono = 'fas fa-exclamation-circle';
        } else if (tipo === 'warning') {
            icono = 'fas fa-exclamation-triangle';
        } else {
        }

        const iconoElement = resultadoMantenimiento.querySelector('i');
        if (iconoElement) {
            iconoElement.className = `${icono}`;
        }

        // Actualizar el mensaje
        const mensajeElement = resultadoMantenimiento.querySelector('#resultadoMensaje');
        if (mensajeElement) {
            mensajeElement.innerHTML = mensaje;
        }

        // Mostrar el elemento
        resultadoMantenimiento.style.display = 'grid';
    }

}

// Función para limpiar cualquier contador activo
function limpiarContador() {
    if (contadorIntervalo) {
        clearInterval(contadorIntervalo);
        contadorIntervalo = null;
    }
}

// Función para mostrar estado de carga en botón
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

            // Iniciar contador
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
            // Para operaciones programadas para el reinicio
            mostrarResultado(`
                <div>
                    <p><i class="fas fa-clock text-warning"></i> <strong>Operación programada para el próximo reinicio</strong></p>
                    <p>Esta operación requiere reiniciar el equipo para completarse.</p>
                    <p>Por favor, guarda tu trabajo y reinicia el sistema cuando sea conveniente.</p>
                    <button id="btn-recordatorio" class="btn btn-sm btn-outline-warning mt-2">Recordármelo más tarde</button>
                </div>
            `, 'warning');

            // Agregar funcionalidad al botón de recordatorio
            setTimeout(() => {
                const btnRecordatorio = document.getElementById('btn-recordatorio');
                if (btnRecordatorio) {
                    btnRecordatorio.addEventListener('click', () => {
                        alert('Se te recordará sobre esta tarea pendiente en 1 hora.');
                        // Aquí podrías implementar un sistema de recordatorios
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
            mostrarResultado(`
                <div>ESPACIO LIBERADO EXITOSAMENTE</div>
                <div id="resultadoMensaje">${data.message}</div>
            `, 'success');
            break;

        case 'error':
        default:
            mostrarResultado(`
                <div>
                    <p>${data.message || "Error desconocido"}</p>
                    <p class="text-muted">Si el problema persiste, contacta con soporte técnico.</p>
                </div>
            `, 'error');
            break;
    }
}

// Función para ejecutar acciones de mantenimiento
async function ejecutarAccion(accion, boton) {

    limpiarContador();
    mostrarCargando(boton, true);

    // Obtener la URL
    const url = actionUrls[accion];
    if (!url) {
        console.error(`URL no encontrada para la acción: ${accion}`);
        mostrarResultado(`
            <div>
                <p><i class="fas fa-exclamation-circle text-danger"></i> <strong>ERROR</strong></p>
                <p>Acción no válida o no configurada.</p>
            </div>
        `, 'error');
        mostrarCargando(boton, false);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error del servidor (HTTP ${response.status})`);
        }

        // Procesar la respuesta JSON
        const data = await response.json();
        console.log("Datos recibidos:", data);

        manejarEstadoRespuesta(data);

    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`
            <div>
                <p><strong>EROR INESPERADO</strong></p>
                <p>${error.message || "No se pudo ejecutar la acción."}</p>
                <p>Por favor, inténtelo de nuevo o contacte con soporte técnico.</p>
            </div>
        `, 'error');
    } finally {
        // Restaurar el botón a su estado normal
        mostrarCargando(boton, false);
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', function () {

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