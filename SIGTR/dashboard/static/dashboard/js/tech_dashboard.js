

// Función para mostrar una alerta de éxito
function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: message,
        confirmButtonText: 'Ok',
        confirmButtonColor: '#28a745'
    });
}

// Función para mostrar una alerta de error
function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonText: 'Ok',
        confirmButtonColor: '#dc3545'
    });
}

// Mostrar alertas basadas en los parámetros de la URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    const errorMessage = urlParams.get('error');

    if (successMessage) {
        showSuccessAlert(successMessage);
    }

    if (errorMessage) {
        showErrorAlert(errorMessage);
    }
});