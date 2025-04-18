document.addEventListener("DOMContentLoaded", function() {
    const modalDiagnostico = document.getElementById('modalDiagnostico');
    const openModalDiagnostico = document.getElementById('btnAbrirModalDiagnostico');
    const closeModalDiagnostico = document.getElementById('closeModalDiagn');
    const progressBarDiagnostico = document.getElementById('progressBarDiagnostico');
    const imgDiag = document.getElementById('imgDiag');
    const btnDiagnostico = document.getElementById('btnDiagnosticoDet');
    
    const progressBarModalDiagnostico = document.getElementById('progress-bar-diagnostico');
    const estadoDiagnostico = document.getElementById('estado-diagnostico');
    const btnIniciarDiagnostico = document.getElementById('iniciar-diagnostico');
    const scanTypeSelect = document.getElementById('scan-type');
    const customScanOptions = document.getElementById('custom-scan-options');
    const customScanPath = document.getElementById('custom-scan-path');
    
    const diagnosisUrls = {
        diagnosis_data: "/dashboard/client/diagnosis-data/",
        comparison: "/dashboard/client/diagnosis/comparison/",
        defender_status: "/dashboard/client/diagnosis/defender/status/"
    };
    
    let scanType = "QuickScan";
    let customPath = "";
    
    if (scanTypeSelect) {
        scanTypeSelect.addEventListener('change', function() {
            if (this.value === 'CustomScan' && customScanOptions) {
                customScanOptions.style.display = 'flex';
            } else if (customScanOptions) {
                customScanOptions.style.display = 'none';
            }
        });
    }
    
    function mostrarNotificacion(tipo, mensaje, duracion) {
        console.log(`Notificación: ${tipo} - ${mensaje}`);
        
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(tipo, mensaje, duracion);
        } else {
            const notificacion = document.createElement('div');
            notificacion.className = `notificacion ${tipo}`;
            notificacion.innerHTML = `<p>${mensaje}</p>`;
            document.body.appendChild(notificacion);
            
            setTimeout(() => {
                notificacion.classList.add('fadeOut');
                setTimeout(() => {
                    notificacion.remove();
                }, 500);
            }, duracion * 1000);
        }
    }
    
    function actualizarProgressBar(elemento, porcentaje) {
        if (elemento) {
            const span = elemento.querySelector('span');
            if (span) {
                span.style.width = porcentaje + '%';
                span.textContent = porcentaje + '%';
            }
        }
    }
    
    function notificacionDiagnostico() {
        let progressBar100Diag = true;
        if (progressBarDiagnostico) {
            const spanDiagnostico = progressBarDiagnostico.querySelector('span');
            if (spanDiagnostico) {
                const width = spanDiagnostico.dataset.width.replace('%', '');
                spanDiagnostico.style.width = spanDiagnostico.dataset.width;
                spanDiagnostico.innerHTML = spanDiagnostico.dataset.width;
                
                if (parseInt(width) < 100) {
                    progressBar100Diag = false;
                }
                
                if (progressBar100Diag) {
                    mostrarNotificacion('success', 'Análisis completo del diagnóstico', 2);
                }
            }
        }
    }
    
    function iniciarDiagnosticoConOpciones(tipo, ruta) {
        scanType = tipo || "QuickScan";
        customPath = ruta || "";
        
        const tipoAnalisisElement = document.querySelector('.tipoAnalisis');
        const progresoAnalisisElement = document.querySelector('.progresoAnalisis');
        
        if (tipoAnalisisElement) tipoAnalisisElement.style.display = 'none';
        if (progresoAnalisisElement) progresoAnalisisElement.style.display = 'block';
        
        if (estadoDiagnostico) {
            estadoDiagnostico.textContent = `Realizando escaneo ${scanType}...`;
        }
        
        iniciarProgresoDiagnostico();
    }
    
    function iniciarProgresoDiagnostico() {
        const barraProgreso = progressBarModalDiagnostico ? progressBarModalDiagnostico : progressBarDiagnostico;
        
        if (barraProgreso) {
            const spanProgreso = barraProgreso.querySelector('span');
            if (spanProgreso) {
                spanProgreso.style.width = '0%';
                spanProgreso.textContent = '0%';
                
                if (document.getElementById('imgDiagGIF')) {
                    document.getElementById('imgDiagGIF').style.display = 'block';
                    if (imgDiag) imgDiag.style.display = 'none';
                }
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 2;
                    
                    if (spanProgreso) {
                        spanProgreso.style.width = progress + '%';
                        spanProgreso.textContent = progress + '%';
                    }
                    
                    if (progressBarDiagnostico && progressBarDiagnostico !== barraProgreso) {
                        actualizarProgressBar(progressBarDiagnostico, progress);
                    }
                    
                    if (estadoDiagnostico) {
                        if (progress < 30) {
                            estadoDiagnostico.textContent = `Analizando rendimiento del sistema...`;
                        } else if (progress < 60) {
                            estadoDiagnostico.textContent = `Verificando estado de seguridad...`;
                        } else if (progress < 85) {
                            estadoDiagnostico.textContent = `Comparando con análisis previos...`;
                        }
                    }
                    
                    if (progress >= 90) {
                        clearInterval(interval);
                        
                        obtenerDatosDiagnostico().then(() => {
                            if (spanProgreso) {
                                spanProgreso.style.width = '100%';
                                spanProgreso.textContent = '100%';
                            }
                            
                            if (progressBarDiagnostico && progressBarDiagnostico !== barraProgreso) {
                                actualizarProgressBar(progressBarDiagnostico, 100);
                            }
                            
                            if (estadoDiagnostico) {
                                estadoDiagnostico.textContent = `Diagnóstico completo`;
                            }
                            
                            if (document.getElementById('imgDiagGIF')) {
                                document.getElementById('imgDiagGIF').style.display = 'none';
                                if (imgDiag) imgDiag.style.display = 'block';
                            }
                            
                            mostrarNotificacion('success', 'Análisis completo del diagnóstico', 2);
                        }).catch(error => {
                            console.error('Error al obtener datos del diagnóstico:', error);
                            mostrarNotificacion('error', 'Error al realizar el diagnóstico', 3);
                            
                            if (estadoDiagnostico) {
                                estadoDiagnostico.textContent = `Error en el diagnóstico: ${error.message}`;
                            }
                            
                            if (document.getElementById('imgDiagGIF')) {
                                document.getElementById('imgDiagGIF').style.display = 'none';
                                if (imgDiag) imgDiag.style.display = 'block';
                            }
                        });
                    }
                }, 100);
            }
        }
    }
    
    async function obtenerDatosDiagnostico() {
        try {
            const diagnosisUrl = `${diagnosisUrls.diagnosis_data}?scan_type=${scanType}&custom_path=${encodeURIComponent(customPath)}`;
            
            const diagnosisResponse = await fetch(diagnosisUrls.diagnosis_data, {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },
                credentials: 'same-origin',
                params: {
                    scan_type: scanType,
                    custom_path: customPath
                }
            });

            console.log("Respuesta de diagnóstico:", diagnosisResponse);

           if (!diagnosisResponse.ok) {
            const errorText = await diagnosisResponse.text();
            console.error("Error body:", errorText);
            throw new Error(`Error del servidor (HTTP ${diagnosisResponse.status}): ${errorText}`);
        }
            
            const diagnosisData = await diagnosisResponse.json();
            
            if (diagnosisData.status !== 'success') {
                throw new Error('Error al obtener datos del diagnóstico: ' + (diagnosisData.message || 'Respuesta incorrecta'));
            }
            
            const comparisonResponse = await fetch(diagnosisUrls.comparison, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!comparisonResponse.ok) {
                throw new Error(`Error en la comparación: ${comparisonResponse.status}`);
            }
            
            const comparisonData = await comparisonResponse.json();
            
            const defenderResponse = await fetch(diagnosisUrls.defender_status, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!defenderResponse.ok) {
                throw new Error(`Error en el estado del antivirus: ${defenderResponse.status}`);
            }
            
            const defenderData = await defenderResponse.json();
            
            actualizarInterfazDiagnostico(diagnosisData, comparisonData, defenderData);
            
            return true;
        } catch (error) {
            console.error('Error en la obtención de datos:', error);
            throw error;
        }
    }
    
    function actualizarInterfazDiagnostico(diagnosisData, comparisonData, defenderData) {
        const componentesHW = document.querySelectorAll('.comparacionHW .componentesHW .resultComponente');
        if (componentesHW.length >= 3 && comparisonData.status === 'success') {
            const formatChange = (change) => {
                if (change === "Sin datos previos" || change === "Sin datos disponibles") {
                    return change;
                }
                const num = parseFloat(change);
                return num >= 0 ? `Aumentó en ${Math.abs(num)}%` : `Disminuyó en ${Math.abs(num)}%`;
            };
            
            let cpuComponent = null;
            let ramComponent = null;
            let diskComponent = null;
            
            document.querySelectorAll('.comparacionHW .componentesHW').forEach(comp => {
                const label = comp.querySelector('.textComponente');
                const result = comp.querySelector('.resultComponente');
                
                if (label && result) {
                    const labelText = label.textContent.trim().toUpperCase();
                    if (labelText.includes('CPU')) {
                        cpuComponent = result;
                    } else if (labelText.includes('RAM')) {
                        ramComponent = result;
                    } else if (labelText.includes('DISCO')) {
                        diskComponent = result;
                    }
                }
            });
            
            if (cpuComponent) cpuComponent.textContent = formatChange(comparisonData.comparison.cpu_change);
            if (ramComponent) ramComponent.textContent = formatChange(comparisonData.comparison.ram_change);
            if (diskComponent) diskComponent.textContent = formatChange(comparisonData.comparison.disk_change);
        }
        
        if (diagnosisData.status === 'success') {
            const resultData = diagnosisData.data;
            
            const contenedorAnalisisIA = document.getElementById('resultadoAnalisisIA');
            if (contenedorAnalisisIA) {
                const componentesIA = contenedorAnalisisIA.querySelectorAll('.componentesHW .resultComponente');
                
                if (componentesIA.length >= 4) {
                    componentesIA[0].textContent = `Uso actual: ${resultData.cpu_usage}. ${generarRecomendacionCPU(resultData.cpu_usage)}`;
                    componentesIA[1].textContent = `RAM: ${resultData.ram_usage.used} de ${resultData.ram_usage.total} (${resultData.ram_usage.percent}). ${generarRecomendacionRAM(resultData.ram_usage.percent)}`;
                    componentesIA[2].textContent = `Disco: ${resultData.disk_usage.used} de ${resultData.disk_usage.total} (${resultData.disk_usage.percent}). ${generarRecomendacionDisco(resultData.disk_usage.percent)}`;
                    
                    let seguridadMsg = "El sistema está protegido adecuadamente.";
                    if (defenderData.status === 'success') {
                        if (!defenderData.data.AntivirusEnabled) {
                            seguridadMsg = "¡Atención! El antivirus está desactivado. Se recomienda activarlo para proteger su sistema.";
                        } else if (!defenderData.data.RealTimeProtectionEnabled) {
                            seguridadMsg = "La protección en tiempo real está desactivada. Se recomienda activarla para mayor seguridad.";
                        }
                    }
                    componentesIA[3].textContent = seguridadMsg;
                }
            }
        }
    }
    
    function generarRecomendacionCPU(cpuUsage) {
        const percent = parseFloat(cpuUsage.replace('%', ''));
        if (percent > 80) {
            return "El uso de CPU es muy alto. Se recomienda cerrar aplicaciones en segundo plano.";
        } else if (percent > 50) {
            return "El uso de CPU es moderado. El sistema funciona correctamente.";
        } else {
            return "El uso de CPU es óptimo.";
        }
    }
    
    function generarRecomendacionRAM(ramPercent) {
        const percent = parseFloat(ramPercent.replace('%', ''));
        if (percent > 85) {
            return "El uso de memoria es muy alto. Se recomienda cerrar aplicaciones o considerar ampliar la memoria RAM.";
        } else if (percent > 70) {
            return "El uso de memoria es elevado. Considere cerrar aplicaciones no utilizadas.";
        } else {
            return "El uso de memoria es adecuado.";
        }
    }
    
    function generarRecomendacionDisco(discoPercent) {
        const percent = parseFloat(discoPercent.replace('%', ''));
        if (percent > 90) {
            return "El disco está casi lleno. Se recomienda liberar espacio urgentemente.";
        } else if (percent > 75) {
            return "El uso del disco es elevado. Considere liberar espacio pronto.";
        } else {
            return "El espacio en disco es adecuado.";
        }
    }
    
    if (btnDiagnostico) {
        btnDiagnostico.addEventListener('click', function() {
            if (openModalDiagnostico) {
                openModalDiagnostico.style.cursor = 'pointer';
                notificacionDiagnostico();
            }
        });
    }
    
    if (openModalDiagnostico) {
        openModalDiagnostico.addEventListener('click', function() {
            if (modalDiagnostico) {
                modalDiagnostico.style.display = 'flex';
                
                if (document.querySelector('.tipoAnalisis')) {
                    document.querySelector('.tipoAnalisis').style.display = 'block';
                }
                if (document.querySelector('.progresoAnalisis')) {
                    document.querySelector('.progresoAnalisis').style.display = 'none';
                }
            }
        });
    }
    
    if (closeModalDiagnostico) {
        closeModalDiagnostico.addEventListener('click', function() {
            if (modalDiagnostico) {
                modalDiagnostico.style.display = 'none';
            }
        });
    }
    
    if (btnIniciarDiagnostico) {
        btnIniciarDiagnostico.addEventListener('click', function() {
            const tipo = scanTypeSelect ? scanTypeSelect.value : "QuickScan";
            const ruta = customScanPath && tipo === "CustomScan" ? customScanPath.value : "";
            
            iniciarDiagnosticoConOpciones(tipo, ruta);
        });
    }
    
    const btnVerAnalisisIA = document.getElementById('btnVerAnalisisIA');
    const resultadoAnalisisIA = document.getElementById('resultadoAnalisisIA');
    
    if (btnVerAnalisisIA && resultadoAnalisisIA) {
        btnVerAnalisisIA.addEventListener('click', function() {
            if (resultadoAnalisisIA.style.display === 'none') {
                resultadoAnalisisIA.style.display = 'block';
            } else {
                resultadoAnalisisIA.style.display = 'none';
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target == modalDiagnostico) {
            modalDiagnostico.style.display = 'none';
        }
    });
    });