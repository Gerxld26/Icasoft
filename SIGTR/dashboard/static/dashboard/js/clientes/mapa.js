let mapInicio, mapaAsist;
let marker, markerAsist;
let markerTech = [];
let defaultLocation = { lat: 0, lng: 0 };
let ubicacionInicial = defaultLocation;
let circuloCliente = null;
// let mapaAsistenciaCreado = false;
let eventoUbicacionAgregado = false;
let marcadorMovido = false;
let LocationBorrar = { lat: -14.064165144575163, lng: -75.7278757166212 };

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    mapInicio = new Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 15,
        mapId: "INICIO_MAP_ID",
    });

    marker = new AdvancedMarkerElement({ map: mapInicio, position: defaultLocation });
    geolocalizacion();
}

function geolocalizacion() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                marker.position = pos;
                mapInicio.setCenter(pos);
                if (markerAsist && mapaAsist && !marcadorMovido) {
                    markerAsist.setPosition(pos);
                    mapaAsist.setCenter(pos);
                }
                ubicacionInicial = pos;
            },
            () => {
                alert("Error obteniendo ubicación.");
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
            }
        );
    } else {
        alert("Geolocalización no soportada por este navegador.");
    }
}

async function mapaAsistencia() {

    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");
    const { Circle } = await google.maps.importLibrary("geometry");
    mapaAsist = new Map(document.getElementById("mapAsistencia"), {
        center: ubicacionInicial,
        zoom: 13,
        mapId: "ASIST_MAP_ID",
    });
    markerAsist = new Marker({
        map: mapaAsist,
        position: ubicacionInicial,
        draggable: true,
    });

    // Crear el círculo de 20 km alrededor del cliente
    circuloCliente = new google.maps.Circle({
        strokeColor: "#FF0000",
        fillOpacity: 0,
        map: mapaAsist,
        center: ubicacionInicial,
        radius: 2000 // 20 km en metros
    });
    markerAsist.addListener('dragend', function () {
        marcadorMovido = true;
        const pos = markerAsist.getPosition();
        obtenerDireccion(pos.lat(), pos.lng());

        // Actualizar centro del círculo
        if (circuloCliente) {
            circuloCliente.setCenter(pos);
        }
    });

    miUbicacion();
    inputUbi();
}
async function locationTech(lat, lon) {
    const { InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    let LocationTech = { lat: lat, lng: lon };

    const pin = new PinElement({
        background: "blue",
        borderColor: "white",
        glyph: "T",
        glyphColor: "white"
    });

    const infoWindow = new InfoWindow();

    const newTech = new AdvancedMarkerElement({
        map: mapaAsist,
        position: LocationTech,
        content: pin.element,
    });

    // newTech.addListener("gmp-click", ({ domEvent, latLng }) => {
    //     const { target } = domEvent;
    //     infoWindow.close();
    //     infoWindow.setContent(newTech.title);
    //     infoWindow.open(newTech.map, newTech);
    // });

    markerTech.push(newTech);
}
function miUbicacion() {
    if (eventoUbicacionAgregado) return;

    const btnUbiCliente = document.getElementById('btnUbiCliente');
    btnUbiCliente.addEventListener("click", () => {
        if (mapaAsist && ubicacionInicial) {
            inputUbi();
        } else {
            alert("Ubicación aún no disponible.");
        }
    });
    eventoUbicacionAgregado = true;
}

function inputUbi() {
    if (mapaAsist && ubicacionInicial) {

        mapaAsist.setCenter(ubicacionInicial);
        markerAsist.setPosition(ubicacionInicial);
        obtenerDireccion(ubicacionInicial.lat, ubicacionInicial.lng);
        tecnicosDisp(ubicacionInicial.lat, ubicacionInicial.lng);
    } else {
        alert("Ubicación aún no disponible.");
    }
}

function obtenerDireccion(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = new google.maps.LatLng(lat, lng);
    document.getElementById('id_latitude').value = lat;
    document.getElementById('id_longitude').value = lng;
    geocoder.geocode({ location: latlng }, function (results, status) {
        if (status === 'OK') {
            if (results[0]) {
                document.getElementById('direccion').value = results[0].formatted_address;
            } else {
                console.error('No se encontraron resultados');
            }
        } else {
            console.error('Error en geocodificación:', status);
        }
    });
}

window.initMap = initMap;