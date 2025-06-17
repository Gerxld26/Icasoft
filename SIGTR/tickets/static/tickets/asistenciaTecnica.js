/*ASISTENCIA TÉCNICA*/
const modalAsistencia = document.getElementById('modalAsistencia');
const openModalAsistencia = document.getElementById('btnAsistencia');
const closeModalAsis = document.getElementById('closeModalAsis');
const btnAsistencia = document.getElementById('btnAsistencia');

openModalAsistencia.addEventListener('click', function () {
    modalAsistencia.style.display = 'flex';
    mapaAsistencia();

})
closeModalAsis.addEventListener('click', function () {
    modalAsistencia.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if (event.target == modalAsistencia) {
        modalAsistencia.style.display = 'none';
    }
})

function tecnicosDisp(lat, lon) { //lat y lon es del cliente que le pasamos en mapa.js
    //Elminar marcadores anteriores
    markerTech.forEach(marker => marker.setMap(null));
    markerTech = [];

    fetch(`/tickets/listar_tecnicos_cercanos/?lat=${lat}&lon=${lon}`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            const tecnicos = data.tecnicos_cercanos;
            let select = '';
            let hayTecnicosCercanos = false;

            tecnicos.forEach((listTecnicos) => {
                const nombre = listTecnicos.technician_name;
                const lugarTecnico = listTecnicos.province_name;
                const distanciaTecnico = listTecnicos.distance_km;

                if (distanciaTecnico <= 2) {
                    hayTecnicosCercanos = true;

                    select += `<option value="${listTecnicos.technician_id}" class="opcion">
                          ${nombre} - ${distanciaTecnico} km
                       </option>`;

                    locationTech(
                        listTecnicos.latitude,
                        listTecnicos.longitude,
                        nombre,
                        distanciaTecnico
                    );

                    tipoAsistencia(lugarTecnico, distanciaTecnico);
                }
            });

            // Si no hay técnicos cercanos dentro de 2 km
            if (!hayTecnicosCercanos) {
                select = `<option class="opcion" disabled selected>No hay técnicos cercanos disponibles</option>`;
            }

            $("#technician").html(select);
        })
        .catch(error => {
            console.error("Error obteniendo técnicos:", error);
        });
}
function tipoAsistencia(lugar, distancia) {
    fetch(`/tickets/tipo_asistencia/`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tipoAsistencia = data.tipo_asistencia;

            let radioOption = '';

            if ((lugar == 'Ica' || lugar == 'Ica Province') && distancia <= 2) {
                tipoAsistencia.forEach((listAsitencias) => {
                    checked = listAsitencias.id === 4 ? 'checked' : '';
                    radioOption += `<input type="radio" id="asistencia_${listAsitencias.id}" name="radioType" value="${listAsitencias.id}" ${checked}>`;
                    radioOption += `<label for="asistencia_${listAsitencias.id}">${listAsitencias.tipo_asistencia}</label><br>`;
                });
            } else if ((lugar == 'Ica' || lugar == 'Ica Province') && distancia > 2 && distancia < 70) {
                radioOption += `<input type="radio" id="asistencia_1" name="radioType" value="1" checked>`;
                radioOption += `<label for="asistencia_1">Remota</label><br>`;
                radioOption += `<input type="radio" id="asistencia_3" name="radioType" value="3">`;
                radioOption += `<label for="asistencia_3">Domicilio</label><br>`;
                radioOption += `<input type="radio" id="asistencia_4" name="radioType" value="4" checked>`;
                radioOption += `<label for="asistencia_4">Traer al local</label><br>`;
            } else if (distancia >= 70) {
                radioOption += `<input type="radio" id="asistencia_1" name="radioType" value="1" checked>`;
                radioOption += `<label for="asistencia_1">Remota</label><br>`;
            } else {
                console.log('Caso no esperado con distancia:', distancia);
            }
            document.getElementById('conentRadioAsist').innerHTML = radioOption;
        })
        .catch(error => {
            console.error('Error al obtener datos de tipo de asistencia:', error);
        });
}
const formData = document.getElementById('formAsistencia');
document.getElementById('formAsistencia').addEventListener("submit", function (event) {
    event.preventDefault();
    if (formData.checkValidity()) {
        const datos = {
            descripcion: document.getElementById('descripcion').value,
            latitud: document.getElementById('id_latitude').value,
            longitud: document.getElementById('id_longitude').value,
            tecnico: document.getElementById('technician').value,
            tipoAsistencia: document.querySelector('input[name="radioType"]:checked').value,
        }
        fetch("/tickets/asistencia/", {
            method: "POST",
            body: JSON.stringify(datos),
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                modalAsistencia.style.display = 'none';
                Swal.fire({
                    icon: "success",
                    title: "Éxito",
                    text: data.message,
                    confirmButtonColor: "#d33",
                    confirmButtonText: "Cerrar"
                });

                btnAsistencia.disabled = false;
            })
            .catch(error => {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hubo un problema con la solicitud. Inténtalo nuevamente.",
                    confirmButtonColor: "#d33",
                    confirmButtonText: "Cerrar"
                });
                btnAsistencia.disabled = false;
            });
    } else {
        formData.reportValidity();
    }
})


