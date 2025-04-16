 // Verificar si Leaflet se carga correctamente
 document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM cargado, verificando Leaflet...");
    
    // Comprobar si Leaflet está disponible
    if (typeof L === 'undefined') {
        console.error("¡Leaflet no está cargado!");
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar el mapa',
            text: 'No se pudo cargar la librería de mapas. Por favor, recarga la página.',
            confirmButtonText: 'Recargar',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
            }
        });
        return;
    }
    
    console.log("Leaflet cargado correctamente. Inicializando mapa...");
    
    // Registrar estado del elemento del mapa
    const mapElement = document.getElementById("map");
    console.log("Elemento del mapa:", mapElement);
    console.log("Dimensiones del mapa:", mapElement.offsetWidth, "x", mapElement.offsetHeight);
    
    // Inicializar mapa con un timeout pequeño para asegurar que el DOM esté listo
    setTimeout(initMap, 100);
});

// Función para inicializar el mapa
function initMap() {
    try {
        // Valores predeterminados para el mapa
        const defaultLat = -12.0464; 
        const defaultLng = -77.0428;
        const MAX_DISTANCE_KM = parseFloat('{{ max_distance }}'); 
        
        let latField = document.getElementById("id_latitude");
        let lonField = document.getElementById("id_longitude");
        let addressField = document.getElementById("id_address");
        let submitButton = document.getElementById("btn-submit");
        
        // Variables para mantener el estado del mapa
        let currentZoomLevel = 13;
        let userPosition = [defaultLat, defaultLng];
        
        // Inicializar mapa con coordenadas predeterminadas
        var map = L.map("map", {
            center: userPosition,
            zoom: currentZoomLevel,
            zoomControl: false // Desactivar controles predeterminados de zoom
        });
        
        console.log("Mapa inicializado:", map);
        
        // Verificar si el mapa se ha inicializado correctamente
        if (!map._loaded) {
            console.error("El mapa no se cargó correctamente");
            return;
        }
        
        // Añadir capa base de OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(map);
        
        // Añadir control de zoom personalizado
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Variables para los marcadores
        var userMarker = null;
        let techMarkers = []; // Array para almacenar los marcadores de los técnicos
        let radiusCircle = null; // Para el círculo de radio
        
        // Iconos personalizados
        var userIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        var techIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        // Funciones auxiliares
        function updateLocation(lat, lon, preserveZoom = true) {
            if (preserveZoom) {
                // Guardar el nivel de zoom actual antes de actualizar
                currentZoomLevel = map.getZoom();
            }
            
            latField.value = lat.toFixed(6);
            lonField.value = lon.toFixed(6);
            userPosition = [lat, lon];
        }

        function updateAddress(lat, lon) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        addressField.value = data.display_name;
                    }
                })
                .catch(error => {
                    console.error("Error obteniendo dirección:", error);
                });
        }

        function clearTechMarkers() {
            techMarkers.forEach(marker => {
                map.removeLayer(marker);
            });
            techMarkers = [];
            
            // Eliminar el círculo de radio si existe
            if (radiusCircle) {
                map.removeLayer(radiusCircle);
                radiusCircle = null;
            }
        }

        function fetchNearbyTechnicians(lat, lon) {
            document.getElementById('loading-technicians').classList.remove('d-none');
            document.getElementById('no-nearby-technicians').classList.add('d-none');
            clearTechMarkers(); // Limpiar marcadores existentes
            
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
                    console.log("Técnicos recibidos:", data);
                    
                    // Verificar si hay técnicos dentro del límite permitido
                    if (!data.has_nearby_technicians) {
                        document.getElementById('no-nearby-technicians').classList.remove('d-none');
                        submitButton.disabled = true;
                    } else {
                        document.getElementById('no-nearby-technicians').classList.add('d-none');
                        submitButton.disabled = false;
                    }
                    
                    updateTechniciansList(data.technicians);
                    displayTechniciansOnMap(data.technicians, data.max_distance || MAX_DISTANCE_KM);
                    document.getElementById('loading-technicians').classList.add('d-none');
                })
                .catch(error => {
                    console.error("Error obteniendo técnicos:", error);
                    document.getElementById('loading-technicians').classList.add('d-none');
                    Swal.fire("Error", "No se pudieron cargar los técnicos cercanos. Inténtelo nuevamente.", "error");
                });
        }

        function displayTechniciansOnMap(technicians, maxDistance) {
            clearTechMarkers();
            
            if (!technicians || technicians.length === 0) {
                console.log("No hay técnicos para mostrar en el mapa");
                return;
            }
            
            console.log("Mostrando técnicos en el mapa, radio máximo:", maxDistance, "km");
            
            // Añadir un círculo que representa la distancia máxima
            radiusCircle = L.circle(userPosition, {
                color: 'rgba(220, 53, 69, 0.6)',
                fillColor: 'rgba(220, 53, 69, 0.1)',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5',
                radius: maxDistance * 1000 // convertir a metros
            }).addTo(map);
            techMarkers.push(radiusCircle);
            
            // Filtrar solo técnicos cercanos para mostrar en el mapa
            const nearbyTechs = technicians.filter(tech => tech.is_nearby);
            
            if (nearbyTechs.length === 0) {
                console.log("No hay técnicos cercanos para mostrar en el mapa");
                return;
            }
            
            nearbyTechs.forEach(tech => {
                try {
                    const lat = parseFloat(tech.latitude);
                    const lng = parseFloat(tech.longitude);
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Añadiendo técnico en [${lat}, ${lng}]`);
                        const marker = L.marker([lat, lng], { icon: techIcon }).addTo(map);
                        marker.bindPopup(`
                            <strong>${tech.username}</strong><br>
                            Distancia: ${tech.distance} km<br>
                            Distrito: ${tech.district_name}
                        `);
                        techMarkers.push(marker);
                    } else {
                        console.warn("Coordenadas inválidas para técnico:", tech);
                    }
                } catch (e) {
                    console.error("Error al mostrar técnico en mapa:", e);
                }
            });
            
            // Ajustar el zoom para mostrar al usuario y los técnicos cercanos
            if (nearbyTechs.length > 0 && userMarker) {
                const markers = [userMarker, ...techMarkers.filter(m => m !== radiusCircle)];
                const group = L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.2));
            }
        }

        function updateTechniciansList(technicians) {
            const select = document.getElementById('technician');
            // Limpiar opciones actuales
            select.innerHTML = '<option value="">-- Elige un técnico --</option>';
            
            if (!technicians || technicians.length === 0) {
                select.innerHTML += '<option>No hay técnicos disponibles en línea.</option>';
                return;
            }
            
            // Dividir en cercanos y lejanos
            const nearbyTechs = technicians.filter(tech => tech.is_nearby);
            const distantTechs = technicians.filter(tech => !tech.is_nearby);
            
            // Agregar técnicos cercanos (habilitados)
            if (nearbyTechs.length > 0) {
                const nearbyGroup = document.createElement('optgroup');
                nearbyGroup.label = 'Técnicos disponibles';
                
                nearbyTechs.forEach(tech => {
                    const option = document.createElement('option');
                    option.value = tech.id;
                    option.textContent = `${tech.username} - ${tech.distance} km - ${tech.district_name}`;
                    nearbyGroup.appendChild(option);
                });
                
                select.appendChild(nearbyGroup);
            }
            
            // Agregar técnicos lejanos (deshabilitados)
            if (distantTechs.length > 0) {
                const distantGroup = document.createElement('optgroup');
                distantGroup.label = 'Técnicos fuera de rango (no disponibles)';
                
                distantTechs.forEach(tech => {
                    const option = document.createElement('option');
                    option.value = tech.id;
                    option.disabled = true;
                    option.textContent = `${tech.username} - ${tech.distance} km - ${tech.district_name} (demasiado lejos)`;
                    distantGroup.appendChild(option);
                });
                
                select.appendChild(distantGroup);
            }

            if (nearbyTechs.length > 0) {
                select.value = nearbyTechs[0].id;
            } else {
                select.value = "";
            }
        }
        
        function updateMapWithoutZoomReset(lat, lon) {
            let currentZoom = map.getZoom();
            
            map.setView([lat, lon], currentZoom);
            
            if (userMarker) {
                userMarker.setLatLng([lat, lon]);
            } else {
                userMarker = L.marker([lat, lon], { 
                    draggable: true, 
                    icon: userIcon 
                }).addTo(map);
                
                userMarker.on("dragend", function () {
                    var newPos = userMarker.getLatLng();
                    updateLocation(newPos.lat, newPos.lng, true);
                    updateAddress(newPos.lat, newPos.lng);
                    fetchNearbyTechnicians(newPos.lat, newPos.lng);
                });
            }
            
            updateLocation(lat, lon, true);
            updateAddress(lat, lon);
            fetchNearbyTechnicians(lat, lon);
        }
        
        function success(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            
            updateMapWithoutZoomReset(lat, lon);
        }

        function error() {
            console.warn("Error al obtener la ubicación del usuario");
            
            updateMapWithoutZoomReset(defaultLat, defaultLng);
            
            Swal.fire({
                title: "Ubicación no disponible",
                text: "No se pudo obtener tu ubicación. Se ha colocado un marcador predeterminado que puedes arrastrar.",
                icon: "warning",
                confirmButtonText: "Entendido"
            });
        }
        
        document.getElementById('btn-usar-ubicacion').addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(success, error);
            } else {
                error();
            }
        });
        
        document.getElementById('btn-zoom-in').addEventListener('click', function() {
            map.zoomIn();
        });
        
        document.getElementById('btn-zoom-out').addEventListener('click', function() {
            map.zoomOut();
        });
        
        document.getElementById('btn-center-map').addEventListener('click', function() {
            if (userMarker) {
                map.setView(userMarker.getLatLng(), 15);
            }
        });
        
        map.on('zoomend', function() {
            currentZoomLevel = map.getZoom();
            console.log("Nuevo nivel de zoom:", currentZoomLevel);
        });
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        } else {
            error();
        }
        
        if (addressField) {
            addressField.addEventListener('change', function() {
                if (this.value.trim() !== '') {
                    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.value)}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data && data.length > 0) {
                                const result = data[0];
                                const lat = parseFloat(result.lat);
                                const lon = parseFloat(result.lon);
                                
                                updateMapWithoutZoomReset(lat, lon);
                            } else {
                                Swal.fire("Dirección no encontrada", "No se pudo encontrar la dirección ingresada", "warning");
                            }
                        })
                        .catch(error => {
                            console.error("Error buscando dirección:", error);
                            Swal.fire("Error", "Ocurrió un error al buscar la dirección", "error");
                        });
                }
            });
        }
        
        setTimeout(function() {
            console.log("Verificando mapa después de 1 segundo...");
            console.log("Dimensiones del mapa:", document.getElementById("map").offsetWidth, "x", document.getElementById("map").offsetHeight);
            console.log("¿Mapa cargado?", map._loaded);
            map.invalidateSize();
        }, 1000);
        
        window.addEventListener('resize', function() {
            map.invalidateSize();
        });
        
    } catch (e) {
        console.error("Error al inicializar el mapa:", e);
        Swal.fire("Error", "No se pudo inicializar el mapa. Por favor, recarga la página.", "error");
    }
}

document.getElementById("assistance-form").addEventListener("submit", function (event) {
    event.preventDefault();

    document.querySelector('button[type="submit"]').disabled = true;

    let formData = new FormData(this);

    // Validación de ubicación
    if (!document.getElementById("id_latitude").value || !document.getElementById("id_longitude").value) {
        Swal.fire("Error", "Debe seleccionar una ubicación en el mapa.", "error");
        document.querySelector('button[type="submit"]').disabled = false;
        return;
    }

    // Validación de técnico seleccionado
    if (!formData.get('technician')) {
        Swal.fire("Error", "Debe seleccionar un técnico para atender su solicitud.", "error");
        document.querySelector('button[type="submit"]').disabled = false;
        return;
    }
    
    // Verificar que el técnico no esté deshabilitado
    const techSelect = document.getElementById('technician');
    const selectedOption = techSelect.options[techSelect.selectedIndex];
    
    if (selectedOption.disabled) {
        Swal.fire({
            icon: "error",
            title: "Técnico no disponible",
            text: "El técnico seleccionado está demasiado lejos de tu ubicación. Por favor, selecciona otro técnico o ajusta tu ubicación.",
            confirmButtonColor: "#d33",
            confirmButtonText: "Entendido"
        });
        document.querySelector('button[type="submit"]').disabled = false;
        return;
    }

    fetch("/tickets/request/", {
        method: "POST",
        body: formData,
        headers: {
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
            console.log("Respuesta del servidor:", data);

            Swal.fire({
                icon: data.status === "success" ? "success" : "error",
                title: data.status === "success" ? "Éxito" : "Error",
                text: data.message,
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Entendido"
            }).then((result) => {
                if (result.isConfirmed && data.status === "success") {
                    window.location.href = data.redirect_url;
                }
            });

            document.querySelector('button[type="submit"]').disabled = false;
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Hubo un problema con la solicitud. Inténtalo nuevamente.",
                confirmButtonColor: "#d33",
                confirmButtonText: "Cerrar"
            });
            document.querySelector('button[type="submit"]').disabled = false;
        });
});