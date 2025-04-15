/* MANTENIMIENTO - Versión con mejoras de UX */
// Referencias a elementos del DOM
const modalMantenimiento = document.getElementById('modalMantenimiento');
const openModalMantenimiento = document.getElementById('btnAbrirModalMantenimiento');
const closeModalMantenimiento = document.getElementById('closeModalMant');
const progressBarMantenimiento = document.getElementById('progressBarMantenimiento');

const imgMant = document.getElementById('imgMant');
const imgMantGIF = document.getElementById('imgMantGIF');
const btnMantFunction = document.getElementById('btnMantFunction');

// Referencias a los botones de acción de mantenimiento
const btnLiberarEspacio = document.querySelector('#cardData1 .btnCardDataFunction');
const btnActualizarSoftware = document.querySelector('#cardData2 .btnCardDataFunction');
const btnDesfragmentar = document.querySelector('#cardData3 .btnCardDataFunction');
const btnReparar = document.querySelector('#cardData4 .btnCardDataFunction');

// Elemento para mostrar resultado dentro del modal
let resultadoMantenimiento = document.getElementById('mantenimientoResultado');

// Variable para almacenar el ID del intervalo del contador
let contadorIntervalo = null;

// URLs directas para las acciones de mantenimiento
// Usar las URLs definidas en el HTML o usar defaults como fallback
const actionUrls = window.ACTION_URLS || {
    cleanup: "/client_clear_space/",
    update: "/client_update_software/",
    defrag: "/client_defragment_disk/",
    repair: "/client_repair_disk/"
};

// Estilos CSS para el spinner
const spinnerCSS = `
.spinner {
    width: 40px;
    height: 40px;
    margin: 10px auto;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #0d6efd;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.progress-indicator {
    text-align: center;
}

.countdown {
    font-size: 14px;
    color: #ffc107;
    margin-top: 10px;
}

.btn-outline-warning {
    color: #ffc107;
    border-color: #ffc107;
    background-color: transparent;
    padding: 5px 15px;
    border-radius: 15px;
    font-size: 14px;
    transition: all 0.3s;
}

.btn-outline-warning:hover {
    color: #000;
    background-color: #ffc107;
}
`;

// Función para añadir los estilos CSS al documento
function agregarEstilosCSS() {
    if (!document.getElementById('mantenimiento-estilos')) {
        const style = document.createElement('style');
        style.id = 'mantenimiento-estilos';
        style.textContent = spinnerCSS;
        document.head.appendChild(style);
    }
}

// Función para mostrar mensajes de resultado
function mostrarResultado(mensaje, tipo = 'info') {
    console.log("Mostrando resultado:", mensaje, tipo);
    
    // Crear o actualizar el elemento de resultado
    if (!resultadoMantenimiento) {
        // Si no existe el elemento, lo creamos
        resultadoMantenimiento = document.createElement('div');
        resultadoMantenimiento.id = 'mantenimientoResultado';
        resultadoMantenimiento.className = `resultado-${tipo}`;
        resultadoMantenimiento.style.marginTop = '20px';
        resultadoMantenimiento.style.padding = '15px';
        resultadoMantenimiento.style.borderRadius = '10px';
        resultadoMantenimiento.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        resultadoMantenimiento.style.border = '2px solid #0d6efd';
        
        // Agregar icono según el tipo
        let icono = 'fa-info-circle';
        if (tipo === 'success') icono = 'fa-check-circle';
        if (tipo === 'error') icono = 'fa-exclamation-circle';
        if (tipo === 'warning') icono = 'fa-exclamation-triangle';
        
        resultadoMantenimiento.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <i class="fas ${icono}" style="font-size: 24px; margin-right: 10px;"></i>
                <div style="font-size: 18px; font-weight: bold;">Resultado de la Operación</div>
            </div>
            <div id="resultadoMensaje">${mensaje}</div>
        `;
        
        // Agregar al DOM
        const contentData = document.querySelector('#modalMantenimiento .contentData');
        if (contentData) {
            contentData.appendChild(resultadoMantenimiento);
        } else {
            console.warn('No se pudo encontrar el contenedor para el resultado');
        }
    } else {
        // Actualizar el elemento existente
        resultadoMantenimiento.className = `resultado-${tipo}`;
        
        // Actualizar el icono
        let icono = 'fa-info-circle';
        if (tipo === 'success') icono = 'fa-check-circle';
        if (tipo === 'error') icono = 'fa-exclamation-circle';
        if (tipo === 'warning') icono = 'fa-exclamation-triangle';
        
        const iconoElement = resultadoMantenimiento.querySelector('i');
        if (iconoElement) {
            iconoElement.className = `fas ${icono}`;
        }
        
        // Actualizar el mensaje
        const mensajeElement = resultadoMantenimiento.querySelector('#resultadoMensaje');
        if (mensajeElement) {
            mensajeElement.innerHTML = mensaje;
        }
        
        // Mostrar el elemento
        resultadoMantenimiento.style.display = 'block';
    }
    
    // Estilos según el tipo
    if (tipo === 'success') {
        resultadoMantenimiento.style.borderColor = '#198754';
    } else if (tipo === 'error') {
        resultadoMantenimiento.style.borderColor = '#dc3545';
    } else if (tipo === 'warning') {
        resultadoMantenimiento.style.borderColor = '#ffc107';
    } else {
        resultadoMantenimiento.style.borderColor = '#0dcaf0';
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
        // Guardar el texto original
        boton.dataset.originalText = boton.innerHTML;
        boton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
        boton.disabled = true;
        boton.style.opacity = '0.7';
    } else {
        // Restaurar el texto original
        if (boton.dataset.originalText) {
            boton.innerHTML = boton.dataset.originalText;
        }
        boton.disabled = false;
        boton.style.opacity = '1';
    }
}

// Función para manejar estados específicos de respuesta
function manejarEstadoRespuesta(data) {
    // Limpiar cualquier contador anterior
    limpiarContador();
    
    // Manejar según el estado
    switch (data.status) {
        case 'in_progress':
            // Mostrar mensaje inicial con contador
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
                
                // Después de 30 segundos, cambiar el mensaje automáticamente
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
            // Para operaciones completadas con éxito
            mostrarResultado(`
                <div>
                    <p><i class="fas fa-check-circle text-success"></i> <strong>Operación completada con éxito</strong></p>
                    <p>${data.message}</p>
                </div>
            `, 'success');
            break;
            
        case 'error':
        default:
            // Para errores
            mostrarResultado(`
                <div>
                    <p><i class="fas fa-exclamation-circle text-danger"></i> <strong>Error</strong></p>
                    <p>${data.message || "Error desconocido"}</p>
                    <p class="text-muted">Si el problema persiste, contacta con soporte técnico.</p>
                </div>
            `, 'error');
            break;
    }
}

// Función para ejecutar acciones de mantenimiento
async function ejecutarAccion(accion, boton) {
    console.log(`Ejecutando acción: ${accion}`);
    
    // Asegurar que el CSS esté añadido
    agregarEstilosCSS();
    
    // Limpiar cualquier contador previo
    limpiarContador();
    
    // Mostrar estado de carga en el botón
    mostrarCargando(boton, true);
    
    // Obtener la URL
    const url = actionUrls[accion];
    if (!url) {
        console.error(`URL no encontrada para la acción: ${accion}`);
        mostrarResultado(`
            <div>
                <p><i class="fas fa-exclamation-circle text-danger"></i> <strong>Error</strong></p>
                <p>Acción no válida o no configurada.</p>
            </div>
        `, 'error');
        mostrarCargando(boton, false);
        return;
    }
    
    try {
        console.log(`Llamando a: ${url}`);
        
        // Hacer la petición al backend
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log(`Respuesta recibida: ${response.status}`);
        
        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error del servidor (HTTP ${response.status})`);
        }
        
        // Procesar la respuesta JSON
        const data = await response.json();
        console.log("Datos recibidos:", data);
        
        // Manejar la respuesta según su estado
        manejarEstadoRespuesta(data);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`
            <div>
                <p><i class="fas fa-exclamation-circle text-danger"></i> <strong>Error inesperado</strong></p>
                <p>${error.message || "No se pudo ejecutar la acción."}</p>
                <p>Por favor, inténtelo de nuevo o contacte con soporte técnico.</p>
            </div>
        `, 'error');
    } finally {
        // Restaurar el botón a su estado normal
        mostrarCargando(boton, false);
    }
}

// Comportamiento para el botón de mantenimiento sin engranajes
if (btnMantFunction) {
    btnMantFunction.addEventListener('click', function() {
        if (openModalMantenimiento) {
            // Activar el botón con engranajes
            openModalMantenimiento.click();
        } else {
            console.warn('Botón de mantenimiento con engranajes no encontrado');
        }
    });
}

// Comportamiento para el botón con engranajes
if (openModalMantenimiento) {
    openModalMantenimiento.addEventListener('click', function() {
        // Mostrar animación
        if (imgMant) imgMant.style.display = 'none';
        if (imgMantGIF) imgMantGIF.style.display = 'flex';
        if (progressBarMantenimiento) progressBarMantenimiento.style.display = 'flex';
        
        // Mostrar modal
        if (modalMantenimiento) modalMantenimiento.style.display = 'flex';
    });
}

// Cerrar modal con el botón X
if (closeModalMantenimiento) {
    closeModalMantenimiento.addEventListener('click', function() {
        // Limpiar cualquier contador antes de cerrar
        limpiarContador();
        
        if (modalMantenimiento) modalMantenimiento.style.display = 'none';
        
        // Restaurar imagen normal
        setTimeout(() => {
            if (imgMant) imgMant.style.display = 'flex';
            if (imgMantGIF) imgMantGIF.style.display = 'none';
        }, 300);
    });
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', function(event) {
    if (event.target == modalMantenimiento) {
        // Limpiar cualquier contador antes de cerrar
        limpiarContador();
        
        modalMantenimiento.style.display = 'none';
        
        // Restaurar imagen normal
        setTimeout(() => {
            if (imgMant) imgMant.style.display = 'flex';
            if (imgMantGIF) imgMantGIF.style.display = 'none';
        }, 300);
    }
});

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando mantenimiento.js con mejoras de UX');
    
    // Agregar estilos CSS
    agregarEstilosCSS();
    
    // Asignar eventos a los botones de acción
    if (btnLiberarEspacio) {
        btnLiberarEspacio.addEventListener('click', function() {
            ejecutarAccion('cleanup', this);
        });
    }
    
    if (btnActualizarSoftware) {
        btnActualizarSoftware.addEventListener('click', function() {
            ejecutarAccion('update', this);
        });
    }
    
    if (btnDesfragmentar) {
        btnDesfragmentar.addEventListener('click', function() {
            ejecutarAccion('defrag', this);
        });
    }
    
    if (btnReparar) {
        btnReparar.addEventListener('click', function() {
            ejecutarAccion('repair', this);
        });
    }
    
    // Verificar elementos críticos
    console.log('Modal de mantenimiento:', modalMantenimiento ? 'Encontrado' : 'No encontrado');
    console.log('Botón abrir modal:', openModalMantenimiento ? 'Encontrado' : 'No encontrado');
    console.log('Botón cerrar modal:', closeModalMantenimiento ? 'Encontrado' : 'No encontrado');
});