const modalAntivirus = document.getElementById('modalAntivirus');
const openModalAntivirus = document.getElementById('btnAbrirModalAntivirus');
const closeModalAntivirus = document.getElementById('closeModalAnt');
const progressBarAnt = document.getElementById('progressBarAntivirus');
const spanAnt = progressBarAnt.querySelector('span');
const imgDetDiag = document.getElementById('imgAntivirusDet');

const antivirusProgresoSeccion = document.getElementById('antivirus-progreso');
const antivirusResultadosSeccion = document.getElementById('antivirus-resultados');
const progresoBarraElemento = document.getElementById('antivirus-progreso-barra');
const progresoTextoElemento = document.getElementById('antivirus-progreso-texto');
const progresosPasos = document.getElementById('antivirus-progreso-pasos').querySelectorAll('.paso');
const logContainer = document.getElementById('antivirus-log-container');
const listaArchivosEscaneados = document.getElementById('archivos-escaneados-lista');

const antivirusHabilitadoElement = document.getElementById('antivirusHabilitado');
const proteccionTiempoRealElement = document.getElementById('proteccionTiempoReal');
const versionAntivirusElement = document.getElementById('versionAntivirus');
const estadoProteccionElement = document.getElementById('estadoProteccion');
const ultimasAmenazasElement = document.getElementById('ultimasAmenazas');
const recomendacionesElement = document.getElementById('recomendacionesSeguridad');

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

function crearContenedorLogsAnimados() {
   const contenedorLogs = document.createElement('div');
   contenedorLogs.className = 'contenedor-logs-animados';
   
   const logActual = document.createElement('div');
   logActual.className = 'log-actual';
   
   contenedorLogs.appendChild(logActual);
   
   return {
       contenedor: contenedorLogs,
       logActual: logActual
   };
}

function mostrarLogAnimado(contenedorLogs, log) {
   const { contenedor, logActual } = contenedorLogs;
   
   const entradaLog = crearEntradaLog(log);
   
   logActual.classList.add('fade-out');
   
   setTimeout(() => {
       logActual.innerHTML = '';
       logActual.appendChild(entradaLog);
       logActual.classList.remove('fade-out');
       logActual.classList.add('fade-in');
   }, 300);
   
   setTimeout(() => {
       logActual.classList.remove('fade-in');
   }, 600);
}

function agregarArchivoEscaneado(nombreArchivo) {
   const archivoElemento = document.createElement('div');
   archivoElemento.className = 'archivo-escaneado';
   archivoElemento.textContent = nombreArchivo;
   listaArchivosEscaneados.appendChild(archivoElemento);
   listaArchivosEscaneados.scrollTop = listaArchivosEscaneados.scrollHeight;
}

function crearEntradaLog(log) {
   const entradaLog = document.createElement('div');
   
   if (typeof log === 'string') {
       log = { 
           file: log, 
           status: 'processing', 
           details: log 
       };
   }
   
   if (log.details && log.details.includes('Permiso denegado')) {
       log.status = 'error';
   }
   
   entradaLog.className = `entrada-log ${log.status}`;
   
   const iconoEstado = document.createElement('span');
   iconoEstado.className = 'icono-estado';
   
   const iconos = {
       'clean': '<i class="fas fa-check-circle text-success"></i>',
       'threat': '<i class="fas fa-exclamation-triangle text-danger"></i>',
       'error': '<i class="fas fa-times-circle text-warning"></i>',
       'processing': '<i class="fas fa-sync-alt text-info"></i>'
   };
   
   iconoEstado.innerHTML = iconos[log.status];
   
   const contenedorLog = document.createElement('div');
   contenedorLog.className = 'detalles-log';
   
   const nombreArchivo = document.createElement('span');
   nombreArchivo.className = 'nombre-archivo';
   nombreArchivo.textContent = log.file || 'Archivo desconocido';
   
   const detallesLog = document.createElement('span');
   detallesLog.className = 'descripcion-log';
   detallesLog.textContent = log.details || 'Sin detalles adicionales';
   
   contenedorLog.appendChild(nombreArchivo);
   contenedorLog.appendChild(detallesLog);
   
   entradaLog.appendChild(iconoEstado);
   entradaLog.appendChild(contenedorLog);
   
   return entradaLog;
}

function actualizarPaso(indice, estado) {
   const pasoElemento = progresosPasos[indice];
   const iconoElemento = pasoElemento.querySelector('.paso-icono');
   
   const iconos = {
       procesando: '<i class="fas fa-hourglass-half"></i>',
       completado: '<i class="fas fa-check-circle"></i>',
       error: '<i class="fas fa-times-circle"></i>'
   };
   
   iconoElemento.innerHTML = iconos[estado];
   pasoElemento.classList.toggle('completado', estado === 'completado');
}

function actualizarProgreso(porcentaje, mensaje) {
   return new Promise(resolve => {
       let progreso = parseFloat(progresoBarraElemento.style.width || 0);
       const incremento = Math.random() * 3 + 1;
       
       const intervalo = setInterval(() => {
           progreso += incremento;
           
           if (Math.random() < 0.1) {
               progreso += Math.random() * 5;
           }
           
           if (progreso >= porcentaje) {
               progresoBarraElemento.style.width = `${porcentaje}%`;
               progresoTextoElemento.textContent = mensaje;
               clearInterval(intervalo);
               resolve();
           } else {
               progresoBarraElemento.style.width = `${progreso}%`;
               
               if (Math.random() < 0.2) {
                   progresoTextoElemento.textContent = obtenerMensajeDinamico();
               }
           }
       }, 50);
   });
}

function obtenerMensajeDinamico() {
   const mensajes = [
       'Analizando archivos del sistema...',
       'Verificando integridad de archivos...',
       'Buscando posibles amenazas...',
       'Procesando directorios...',
       'Preparando informe de seguridad...'
   ];
   return mensajes[Math.floor(Math.random() * mensajes.length)];
}

async function realizarEscaneoAntivirus() {
   const csrftoken = getCookie('csrftoken');
   
   const logsAnimados = crearContenedorLogsAnimados();
   logContainer.innerHTML = '';
   logContainer.appendChild(logsAnimados.contenedor);
   listaArchivosEscaneados.innerHTML = '';
   
   try {
       modalAntivirus.style.display = 'flex';
       antivirusProgresoSeccion.style.display = 'block';
       antivirusResultadosSeccion.style.display = 'none';
       
       actualizarPaso(0, 'procesando');
       await actualizarProgreso(10, 'Iniciando análisis de sistema');
       mostrarLogAnimado(logsAnimados, 'Preparando escaneo');

       actualizarPaso(0, 'completado');
       actualizarPaso(1, 'procesando');
       await actualizarProgreso(40, 'Escaneando archivos del sistema');
       mostrarLogAnimado(logsAnimados, 'Escaneando archivos del sistema');

       const responseEscaneo = await fetch('/dashboard/system/virus-scan/', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'X-Requested-With': 'XMLHttpRequest',
               'X-CSRFToken': csrftoken
           },
           credentials: 'same-origin'
       });

       const datosEscaneo = await responseEscaneo.json();
       const archivosmaliciosos = datosEscaneo.scan_results.potentially_malicious;

       if (datosEscaneo.scan_results.scan_logs) {
           for (const log of datosEscaneo.scan_results.scan_logs) {
               mostrarLogAnimado(logsAnimados, log);
               
               if (log.file) {
                   agregarArchivoEscaneado(log.file);
               }
               
               await new Promise(resolve => setTimeout(resolve, 2000));
           }
       }

       actualizarPaso(1, 'completado');
       actualizarPaso(2, 'procesando');
       await actualizarProgreso(80, 'Analizando amenazas');
       
       archivosmaliciosos.forEach(archivo => {
           mostrarLogAnimado(logsAnimados, {
               file: archivo.file, 
               status: 'threat', 
               details: `Amenazas detectadas: ${archivo.detections} de ${archivo.total_engines} motores`
           });
       });

       actualizarPaso(2, 'completado');
       actualizarPaso(3, 'procesando');
       await actualizarProgreso(100, 'Análisis completado');
       mostrarLogAnimado(logsAnimados, 'Análisis completado');

       antivirusProgresoSeccion.style.display = 'none';
       antivirusResultadosSeccion.style.display = 'block';

       antivirusHabilitadoElement.textContent = 'Sí';
       proteccionTiempoRealElement.textContent = 'Activado';
       versionAntivirusElement.textContent = 'Última versión';

       estadoProteccionElement.textContent = archivosmaliciosos.length > 0 
           ? 'Sistema con amenazas detectadas' 
           : 'Sistema Protegido';
       
       estadoProteccionElement.className = `contenido ${archivosmaliciosos.length > 0 ? 'amenaza' : 'protegido'}`;

       ultimasAmenazasElement.innerHTML = archivosmaliciosos.length > 0 
           ? archivosmaliciosos.map(archivo => 
               `Archivo potencialmente malicioso: ${archivo.file}`
           ).join('<br>') 
           : 'No se detectaron amenazas';

       recomendacionesElement.innerHTML = archivosmaliciosos.length > 0 
           ? `
           <ul>
               <li>Se detectaron ${archivosmaliciosos.length} archivos sospechosos</li>
               <li>Realizar análisis detallado</li>
               <li>Considerar eliminación de archivos</li>
           </ul>` 
           : `
           <ul>
               <li>Sistema limpio</li>
               <li>Mantener actualizaciones</li>
               <li>Escaneos periódicos</li>
           </ul>`;

   } catch (error) {
       console.error('Error en escaneo de antivirus:', error);
       antivirusProgresoSeccion.innerHTML = `
           <div class="error-content">
               <h2>Error en el análisis</h2>
               <p>No se pudo completar el escaneo. Intente nuevamente.</p>
           </div>
       `;
   }
}

function AntivirusFunction() {
   openModalAntivirus.style.pointerEvents = 'none';
   spanAnt.style.width = '0%';
   spanAnt.textContent = '0%';
   
   realizarEscaneoAntivirus().finally(() => {
       setTimeout(() => {
           openModalAntivirus.style.pointerEvents = 'auto';
       }, 3000);
   });
}

openModalAntivirus.addEventListener('click', function () {
    const contenedorAnt = document.querySelector(".antivirus");
    contenedorAnt.classList.add("borde-animado");
    if (btnPressAnalisis) { 
        modalAntivirus.style.display = 'flex';
    } else {
        AntivirusFunction();
    }
    obtenerEstadoAntivirus();
    imgDetDiag.style.height = '70px';
    openModalAntivirus.style.fontSize = '18px';
    progressBarAnt.style.display = 'flex';
})

closeModalAntivirus.addEventListener('click', function () {
   modalAntivirus.style.display = 'none';
});

window.addEventListener('click', function (event) {
   if (event.target == modalAntivirus) {
       modalAntivirus.style.display = 'none';
   }
});