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

function tecnicosDisp(lat, lon) { //la lat y lon que se le pasa es del cliente.
    //clearTechMarkers(); // Limpiar marcadores existentes
    fetch(`/tickets/get_nearby_technicians/?lat=${lat}&lon=${lon}`, {
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

            btnAsistencia.disabled = !data.has_nearby_technicians;
            updateTechniciansList(data.technicians);
        })
        .catch(error => {
            console.error("Error obteniendo técnicos:", error);
        });
}
//Cargar el combo de selecciones: 
function updateTechniciansList(technicians) {
    const select = document.getElementById('technician');
    // Limpiar opciones actuales
    select.innerHTML = '<option value="">Técnicos disponibles</option>';
    
    if (!technicians || technicians.length === 0) {
        select.innerHTML += '<option>No hay técnicos disponibles en línea.</option>';
        return;
    }
    
    // Dividir en cercanos y lejanos
    const nearbyTechs = technicians.filter(tech => tech.is_nearby);
    const distantTechs = technicians.filter(tech => !tech.is_nearby);
    
    // técnicos cercanos (habilitados)
    if (nearbyTechs.length > 0) {
        const nearbyGroup = document.createElement('optgroup');
        
        nearbyTechs.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = `${tech.username} - ${tech.distance} km - ${tech.district_name}`;
            nearbyGroup.appendChild(option);
            locationTech(tech.latitude, tech.longitude);
        });
        
        select.appendChild(nearbyGroup);
    }
    
    // // técnicos lejanos (deshabilitados)
    // if (distantTechs.length > 0) {
    //     const distantGroup = document.createElement('optgroup');
    //     distantGroup.label = 'Técnicos fuera de rango (no disponibles)';
        
    //     distantTechs.forEach(tech => {
    //         const option = document.createElement('option');
    //         option.value = tech.id;
    //         option.disabled = true;
    //         option.textContent = `${tech.username} - ${tech.distance} km - ${tech.district_name} (demasiado lejos)`;
    //         distantGroup.appendChild(option);
    //     });
        
    //     select.appendChild(distantGroup);
    // }

    if (nearbyTechs.length > 0) {
        select.value = nearbyTechs[0].id;
    } else {
        select.value = "";
    }
}
const formData = document.getElementById('formAsistencia'); 
document.getElementById('formAsistencia').addEventListener("submit", function (event) {
    event.preventDefault();
    if(formData.checkValidity()){
        const datos ={
            descripcion: document.getElementById('descripcion').value,
            latitud: document.getElementById('id_latitude').value,
            longitud: document.getElementById('id_longitude').value,
            tecnico: document.getElementById('technician').value,
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
    
                Swal.fire({
                    icon: data.status === "success" ? "success" : "error",
                    title: data.status === "success" ? "Éxito" : "Error",
                    text: data.message,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Entendido"
                }).then((result) => {
                    if (result.isConfirmed && data.status === "success") {
                       modalAsistencia.style.display='none';
                    }
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
    }else{
        formData.reportValidity();
    }
})


