// Manejo de mensajes de Django con SweetAlert2
document.addEventListener("DOMContentLoaded", () => {
    const messages = JSON.parse(document.getElementById("django-messages").textContent);

    messages.forEach((message) => {
        Swal.fire({
            title: capitalizeFirstLetter(message.tags),
            text: message.message,
            icon: message.tags, // Suponiendo que los tags contienen 'success', 'error', etc.
            confirmButtonText: "Aceptar",
        });
    });
});

// Función para capitalizar la primera letra de los mensajes
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
