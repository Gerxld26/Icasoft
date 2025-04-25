function initBasicMap() {
    const defaultLat = -12.0464;
    const defaultLng = -77.0428;
    const defaultZoom = 15;

    const mapInicio = L.map("map", {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(mapInicio);

    L.control.zoom({
        position: 'topright'
    }).addTo(mapInicio);

    // Icono azul personalizado
    const userIcon = L.icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    let marcadorUbi = null;

    // Ver si el navegador soporta geolocalización

    navigator.geolocation.watchPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (!marcadorUbi) {
                // Crear el marcador por primera vez
                marcadorUbi = L.marker([lat, lng], { icon: userIcon }).addTo(mapInicio);
                marcadorUbi.bindPopup("Tu ubicación actual").openPopup();
                mapInicio.setView([lat, lng], defaultZoom);
            } else {
                // Actualizar posición
                marcadorUbi.setLatLng([lat, lng]);
            }
        },
        function (error) {
            console.error("Error obteniendo la ubicación:", error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
        }
    );

}
initBasicMap();
