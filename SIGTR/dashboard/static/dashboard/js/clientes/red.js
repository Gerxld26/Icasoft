document.addEventListener('DOMContentLoaded', function() {
    const btnRed = document.getElementById('btnRed');
    const modalComprobacionRed = document.getElementById('modalComprobacionRed');
    const closeModalComprobacionRed = document.getElementById('closeModalComprobacionRed');
    const redBtnIniciarTest = document.getElementById('red-btn-iniciar-test');
    const redBtnNuevaPrueba = document.getElementById('red-btn-nueva-prueba');
    const speedTestUrl = "/dashboard/speed-test/";
    const progressBarRed = document.getElementById('progressBarRed');
    const spanRed = progressBarRed.querySelector('span');
    let testEnProgreso = false;
    let intervalId = null;
    
    function RedFunction() {
        btnRed.style.pointerEvents = 'none';
        spanRed.style.width = '0%';
        spanRed.textContent = '0%';
        const porcentajeFinal = parseInt(spanRed.dataset.width.replace('%', ''));
        const typeNotification = () => mostrarNotificacion('success', 'Análisis completo de la red', 2);
    
        animarProgreso(spanRed, porcentajeFinal, () => {
            setTimeout(() => {
                btnRed.style.pointerEvents = 'auto';
                abrirModalRed();
                iniciarTestVelocidad();
            }, 3000);
        }, typeNotification);
    }
    if (btnRed) {
        btnRed.addEventListener('click', (e) => {
            const contenedorRed = document.querySelector(".red");
            contenedorRed.classList.add("borde-animado");
            e.preventDefault();
            RedFunction();
            if (btnPressAnalisis) { 
                abrirModalRed();
                iniciarTestVelocidad();
            } else {
                RedFunction();
            }
            progressBarRed.style.display= "flex";
        });
    }
    function abrirModalRed() {
        if (modalComprobacionRed) {
            modalComprobacionRed.style.display = 'flex';
            modalComprobacionRed.offsetWidth;
            
            resetearInterfaz();
            
            setTimeout(asegurarBotonVisible, 100);
        }
    }

    closeModalComprobacionRed.addEventListener('click', function () {
        modalComprobacionRed.style.display = 'none';
        cancelarPrueba();
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modalComprobacionRed) {
            modalComprobacionRed.style.display = 'none';
        }
    });

    function asegurarBotonVisible() {
        const seccionBoton = document.querySelector('.red-iniciar-seccion');
        const botonIniciar = document.getElementById('red-btn-iniciar-test');
        
        if (seccionBoton) {
            seccionBoton.style.display = 'block';
            seccionBoton.style.visibility = 'visible';
        }
        
        if (botonIniciar) {
            botonIniciar.style.display = 'inline-flex';
            botonIniciar.style.visibility = 'visible';
        }
    }
    
    function resetearInterfaz() {
        const seccionEstado = document.querySelector('.red-estado-seccion');
        const seccionProgreso = document.querySelector('.red-progreso-seccion');
        const seccionResultados = document.querySelector('.red-resultados-seccion');
        
        if (seccionEstado) seccionEstado.style.display = 'block';
        if (seccionProgreso) seccionProgreso.style.display = 'none';
        if (seccionResultados) seccionResultados.style.display = 'none';
        
        const aguja = document.querySelector('.red-estado-seccion .red-velocimetro-aguja');
        const valor = document.querySelector('.red-estado-seccion .red-velocimetro-valor');
        
        if (aguja) aguja.style.transform = 'rotate(-90deg)';
        if (valor) valor.textContent = '0.00';
        
        if (testEnProgreso) {
            cancelarPrueba();
        }
        
        asegurarBotonVisible();
    }
    
    function cancelarPrueba() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        testEnProgreso = false;
    }
    
    function iniciarTestVelocidad() {
        if (testEnProgreso) return;
        
        testEnProgreso = true;
        
        const seccionEstado = document.querySelector('.red-estado-seccion');
        const seccionProgreso = document.querySelector('.red-progreso-seccion');
        
        if (seccionEstado) seccionEstado.style.display = 'none';
        if (seccionProgreso) seccionProgreso.style.display = 'grid';
        
        const barraProgreso = document.getElementById('red-progreso-barra');
        const textoProgreso = document.getElementById('red-progreso-texto');
        const mensajeProgreso = document.getElementById('red-mensaje-progreso');
        
        const aguja = document.querySelector('.red-progreso-seccion .red-velocimetro-aguja');
        const valor = document.querySelector('.red-progreso-seccion .red-velocimetro-valor');
        
        if (aguja) aguja.style.transform = 'rotate(-90deg)';
        if (valor) valor.textContent = '0.00';
        
        actualizarBarraProgreso(0);
        
        let progreso = 0;
        let velocidadSimulada = 0;
        
        intervalId = setInterval(() => {
            progreso += 1;
            if (progreso <= 95) {
                actualizarBarraProgreso(progreso);
                
                if (progreso < 30) {
                    if (mensajeProgreso) mensajeProgreso.textContent = 'Conectando con el servidor de pruebas...';
                    velocidadSimulada = Math.random() * 10;
                } else if (progreso < 60) {
                    if (mensajeProgreso) mensajeProgreso.textContent = 'Analizando velocidad de descarga...';
                    velocidadSimulada = 50 + Math.random() * 450;
                } else if (progreso < 90) {
                    if (mensajeProgreso) mensajeProgreso.textContent = 'Analizando velocidad de subida...';
                    velocidadSimulada = 300 + Math.random() * 200;
                } else {
                    if (mensajeProgreso) mensajeProgreso.textContent = 'Calculando resultados...';
                    velocidadSimulada = 400 + Math.random() * 200;
                }
                
                actualizarVelocimetro(velocidadSimulada);
            }
        }, 50);
        
        fetch(speedTestUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            clearInterval(intervalId);
            intervalId = null;
            
            actualizarBarraProgreso(100);
            const iconCheck = '<i id="btnResultadosWifi" class="fa-solid fa-eye-slash" style= "color: white; font-size: 20px;"></i>';
            if (mensajeProgreso) mensajeProgreso.innerHTML = `Análisis completado ${iconCheck}`;
            
            const velocidadDescarga = data.data.download_speed;
            actualizarVelocimetro(velocidadDescarga);
            
            setTimeout(() => {
                const btnResultadosWifi = document.getElementById('btnResultadosWifi');
                btnResultadosWifi.addEventListener('click', () => {
                    mostrarResultados(data); 
                });
            }, 600);
        })
        .catch(error => {
            clearInterval(intervalId);
            intervalId = null;
            
            if (mensajeProgreso) mensajeProgreso.textContent = 'Error al realizar la prueba. Inténtelo de nuevo.';
            actualizarBarraProgreso(0);
            
            testEnProgreso = false;
            
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('error', 'Error al realizar la prueba de velocidad', 3);
            }
            
            setTimeout(() => {
                resetearInterfaz();
            }, 2000);
        });
    }
    
    function actualizarBarraProgreso(porcentaje) {
        const barraProgreso = document.getElementById('red-progreso-barra');
        const textoProgreso = document.getElementById('red-progreso-texto');
        
        if (barraProgreso) {
            barraProgreso.style.width = porcentaje + '%';
            if (textoProgreso) textoProgreso.textContent = porcentaje + '%';
        }
    }
    
    function actualizarVelocimetro(velocidad) {
        const agujas = document.querySelectorAll('.red-velocimetro-aguja');
        const valores = document.querySelectorAll('.red-velocimetro-valor');
        
        if (!agujas.length || !valores.length) return;
        
        let angulo = -90;
        
        if (velocidad <= 0) {
            angulo = -90;
        } else if (velocidad < 10) {
            angulo = -90 + (velocidad / 10 * 15);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(0, 217, 255, 0.7)";
            });
        
        } else if (velocidad < 50) {
            angulo = -75 + ((velocidad - 10) / 40 * 15);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(186, 7, 79, 0.7)";
            });
        } else if (velocidad < 100) {
            angulo = -60 + ((velocidad - 50) / 50 * 15);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(244, 0, 98, 0.7)";
            });
        } else if (velocidad < 250) {
            angulo = -45 + ((velocidad - 100) / 150 * 30);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(255, 153, 0, 0.7)";
            });
        } else if (velocidad < 500) {
            angulo = -15 + ((velocidad - 250) / 250 * 45);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(0, 247, 255, 0.7)";
            });
        } else if (velocidad <= 1000) {
            angulo = 30 + ((velocidad - 500) / 500 * 60);
            agujas.forEach(aguja => {
                aguja.style.boxShadow = "7px 0px 19px 9px rgba(51, 255, 0, 0.7)";
            });
        } else {
            angulo = 90;
        }
        
        agujas.forEach(aguja => {
            if (aguja) aguja.style.transform = `rotate(${angulo}deg)`;
        });
        
        valores.forEach(valor => {
            if (valor) valor.textContent = velocidad.toFixed(2);
        });
    }
    
    function mostrarResultados(data) {
        if (data.status === 'success') {
            const velocidadDescarga = data.data.download_speed;
            const velocidadSubida = data.data.upload_speed;
            const ping = data.data.ping;
            
            const descargaElement = document.getElementById('red-valor-descarga');
            const subidaElement = document.getElementById('red-valor-subida');
            const pingElement = document.getElementById('red-valor-ping');
            const servidorElement = document.getElementById('red-info-servidor');
            const evaluacionElement = document.getElementById('red-info-evaluacion');
            const recomendacionElement = document.getElementById('red-recomendacion-text');
            
            if (descargaElement) descargaElement.textContent = `${velocidadDescarga} Mbps`;
            if (subidaElement) subidaElement.textContent = `${velocidadSubida} Mbps`;
            if (pingElement) pingElement.textContent = `${ping} ms`;
            
            if (servidorElement) {
                const serverName = data.data.server.name || 'Desconocido';
                const serverLocation = data.data.server.location || '';
                servidorElement.textContent = serverLocation ? `${serverName} (${serverLocation})` : serverName;
            }
            
            let calidad = '';
            let recomendacion = '';
            
            if (velocidadDescarga >= 100 && ping < 20) {
                calidad = 'Excelente';
                recomendacion = 'Su conexión es óptima para todas las actividades en línea, incluyendo streaming en 4K y videojuegos.';
            } else if (velocidadDescarga >= 50 && ping < 50) {
                calidad = 'Muy Buena';
                recomendacion = 'Su conexión es adecuada para todas las actividades en línea, incluyendo streaming en 4K y videojuegos.';
            } else if (velocidadDescarga >= 25 && ping < 80) {
                calidad = 'Buena';
                recomendacion = 'Su conexión es adecuada para la mayoría de actividades, pero podría experimentar problemas con streaming en 4K.';
            } else if (velocidadDescarga >= 10 && ping < 100) {
                calidad = 'Aceptable';
                recomendacion = 'Su conexión es funcional para navegación y streaming en HD, pero podría experimentar lentitud en descargas grandes.';
            } else {
                calidad = 'Deficiente';
                recomendacion = 'Su conexión presenta problemas. Recomendamos revisar su router, acercarse más al punto de acceso o contactar a su proveedor de servicios.';
            }
            
            if (evaluacionElement) evaluacionElement.textContent = calidad;
            if (recomendacionElement) recomendacionElement.textContent = recomendacion;
            
            const seccionProgreso = document.querySelector('.red-progreso-seccion');
            const seccionResultados = document.querySelector('.red-resultados-seccion');
            
            if (seccionProgreso) seccionProgreso.style.display = 'none';
            if (seccionResultados) seccionResultados.style.display = 'block';
            if (seccionResultados) seccionResultados.style.gridTemplateAreas = `"red-velocimetro-progreso" "analisisRed"`;
     
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('success', 'Análisis de red completado', 3);
            }
        } else {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('error', data.message || 'Error al obtener resultados', 3);
            }
            
            setTimeout(() => {
                resetearInterfaz();
            }, 2000);
        }
        
        testEnProgreso = false;
    }
    
    if (redBtnIniciarTest) {
        redBtnIniciarTest.addEventListener('click', iniciarTestVelocidad);
    }
    
    if (redBtnNuevaPrueba) {
        redBtnNuevaPrueba.addEventListener('click', function() {
            resetearInterfaz();
            iniciarTestVelocidad();
        });
    }
    
    setTimeout(function() {
        const btnCompRed = document.querySelector('.COMPROBACIÓN-DE-RED, [href="#COMPROBACIÓN-DE-RED"]');
        if (btnCompRed) {
            btnCompRed.addEventListener('click', function(e) {
                e.preventDefault();
            });
        }
        
        const btnRedAlt = document.getElementById('btnRed');
        if (btnRedAlt) {
            btnRedAlt.removeAttribute('onclick');
            btnRedAlt.addEventListener('click', function(e) {
                e.preventDefault();
            });
        }
    }, 500);
    
    asegurarBotonVisible();
});