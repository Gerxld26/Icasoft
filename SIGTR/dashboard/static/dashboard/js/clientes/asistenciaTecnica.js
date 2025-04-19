/*ASISTENCIA TÉCNICA*/
const modalAsistencia = document.getElementById('modalAsistencia');
const openModalAsistencia = document.getElementById('btnAsistencia');
const closeModalAsis = document.getElementById('closeModalAsis');

openModalAsistencia.addEventListener('click', function () {
    modalAsistencia.style.display = 'flex';
})
closeModalAsis.addEventListener('click', function () {
    modalAsistencia.style.display = 'none';
})
window.addEventListener('click', function (event) {
    if (event.target == modalAsistencia) {
        modalAsistencia.style.display = 'none';
    }
})
function initMapAsistencia() {
    try {
        const defaultLat = -12.0464;
        const defaultLng = -77.0428;
        const MAX_DISTANCE_KM = 15; // Puedes ajustar esto o pasarlo como parámetro

        let addressInput = document.getElementById("inputDireccion");
        let locationButton = document.querySelector(".btnUbiCliente");

        let currentZoomLevel = 13;
        let userPosition = [defaultLat, defaultLng];

        let map = L.map("mapAsistencia", {
            center: userPosition,
            zoom: currentZoomLevel,
            zoomControl: false
        });


        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        var userMarker = null;
        let techMarkers = [];
        let radiusCircle = null;

        //ícono de la localización del cliente.
        var userIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        //ícono de la localización del técnico.
        var techIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        function success(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            updateMapWithoutZoomReset(lat, lon);
        }
        function error() {
            console.warn("Error al obtener la ubicación del usuario");

            updateMapWithoutZoomReset(defaultLat, defaultLng);
        }
        function updateLocation(lat, lon, preserveZoom = true) {
            if (preserveZoom) {
                currentZoomLevel = map.getZoom();
            }
            // latField.value = lat.toFixed(6);
            // lonField.value = lon.toFixed(6);
            userPosition = [lat, lon];
        }
        function updateAddress(lat, lon) {
            addressInput.value = "Cargando dirección...";
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        addressInput.value = data.display_name;
                    }
                })
                .catch(error => {
                    console.error("Error obteniendo dirección:", error);
                });
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
                    //fetchNearbyTechnicians(newPos.lat, newPos.lng);
                });
            }

            updateLocation(lat, lon, true);
            updateAddress(lat, lon);
            //fetchNearbyTechnicians(lat, lon);
        }

        locationButton.addEventListener('click', function () {
            addressInput.value = "Cargando ubicación...";
            navigator.geolocation.getCurrentPosition(success, error);
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        } else {
            error();
        }
        addressInput.addEventListener('change', function () {
            if (this.value.trim() !== '') {

                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.value)}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            const result = data[0];
                            const lat = parseFloat(result.lat);
                            const lon = parseFloat(result.lon);

                            updateMapWithoutZoomReset(lat, lon);
                        } 
                    })
                    .catch(error => {
                        console.error("Error buscando dirección:", error);
                    });
            }
        });
        setTimeout(function () {
            console.log("¿Mapa cargado?", map._loaded);

            map.invalidateSize();
        }, 1000);

        window.addEventListener('resize', function () {
            map.invalidateSize();
        });
    } catch (e) {
        console.error("Error al inicializar el mapa:", e);
    }
}

// $(document).ready(function () {
//     initMapAsistencia();
// });

