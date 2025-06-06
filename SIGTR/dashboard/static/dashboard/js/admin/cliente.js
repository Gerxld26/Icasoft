document.addEventListener('DOMContentLoaded', function () {
    // const modalElement = document.getElementById('addTechnicianModal');
    // const form = document.getElementById('add-technician-form');

    // modalElement.addEventListener('show.bs.modal', function () {
    //     form.reset();
    //     form.querySelectorAll('input[type="text"], input[type="email"], input[type="file"], textarea').forEach(input => input.value = '');
    //     form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    // });
    //addClient();
    tooltips();
});
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

// Función para confirmar activación/desactivación de usuario
function confirmToggleClientStatus(userId, isActive) {
    Swal.fire({
        title: isActive === 'true' ? '¿Estás seguro de desactivar este usuario?' : '¿Estás seguro de activar este usuario?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar!'
    }).then((result) => {
        if (result.isConfirmed) {
            toggleUserStatus(userId);
        }
    });
}

// Función para activar/desactivar usuario mediante `POST`
function toggleUserStatus(userId) {
    fetch(`/dashboard/toggle-user-status/${userId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            Swal.fire('¡Hecho!', data.message, 'success').then(() => location.reload());
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error', 'Ocurrió un error al cambiar el estado.', 'error');
    });
}

// Función para confirmar la eliminación del usuario
function confirmDeleteUser(userId) {
    Swal.fire({
        title: '¿Estás seguro de eliminar este usuario?',
        text: "Esta acción no se puede deshacer!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteUser(userId);
        }
    });
}

// Función para eliminar usuario mediante `POST`
function deleteUser(userId) {
    fetch(`/dashboard/delete-user/${userId}/`, {
        method: 'POST',  // 🔥 Ahora solo usa POST
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),  // ✅ CSRF Token correcto
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            Swal.fire('¡Eliminado!', data.message, 'success').then(() => location.reload());
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire('Error', 'Ocurrió un error al eliminar al usuario.', 'error');
    });
}