document.addEventListener('DOMContentLoaded', function () {
    const openPruebaModalButton = document.getElementById('openPruebaModal');
    const pruebaModalContainer = document.getElementById('pruebaModalContainer');
    const pruebaModal = document.getElementById('pruebaModal');

    if (openPruebaModalButton && pruebaModalContainer && pruebaModal) {
        openPruebaModalButton.addEventListener('click', function () {
       
            fetch('/dashboard/client/modalMonitoreo/')  
                .then(response => {
                    console.log('Respuesta recibida:', response);
                    if (!response.ok) {
                        throw new Error(`Error HTTP: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    console.log('HTML recibido:', html);
                    pruebaModalContainer.innerHTML = html;

                    const modalInstance = new bootstrap.Modal(pruebaModal);
                    modalInstance.show();
                })
                .catch(error => {
                    console.error('Error al cargar el modal:', error);
                    alert(`No se pudo cargar el modal. ${error.message}`);
                });
        });
    } else {
        console.error('Elementos no encontrados:', {
            openPruebaModalButton,
            pruebaModalContainer,
            pruebaModal
        });
    }
});