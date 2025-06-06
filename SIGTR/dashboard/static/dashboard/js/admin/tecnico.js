
document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('addTechnicianModal');
    const form = document.getElementById('add-technician-form');

    modalElement.addEventListener('show.bs.modal', function () {
        form.reset();
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="file"], textarea').forEach(input => input.value = '');
        form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    });
    addTech();
    tooltips();
});
function tooltips(){
    // Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}
//función agregar técnico:
function addTech() {
    const form = document.getElementById('add-technician-form');
    const modalElement = document.getElementById('addTechnicianModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        formData.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch("/dashboard/tecnicos/agregar/", {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest' // La vista detectará que es AJAX y devolverá JSON.  indicar al servidor que la solicitud se hizo desde JavaScript de forma asíncrona (es decir, no es una petición normal que recarga la página).
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) return response.json().then(data => Promise.reject(data));
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Técnico agregado',
                text: data.message,
                timer: 3000,
                showConfirmButton: false
            });

            form.reset();
            modal.hide();

            location.reload(); 

        })
        .catch(error => {
            if (error.errors) {
                const errors = error.errors;
                let errorMessages = '';
                for (let field in errors) {
                    errors[field].forEach(e => {
                        errorMessages += `• ${e.message}\n`;
                    });
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Errores en el formulario',
                    text: errorMessages
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error inesperado',
                    text: 'No se pudo agregar el técnico.'
                });
            }
        });
    });
}
//función actualizar técnico:
function editTech(techId) {
     const form = document.getElementById('edit-technician-form');
    const modalElementEdit = document.getElementById('addEditModal');
    const modalEdit = bootstrap.Modal.getOrCreateInstance(modalElementEdit);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // GET: Cargar datos del técnico
    fetch(`/dashboard/tecnicos/update/${techId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Rellenar campos automáticamente
        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            console.log(`${key}: ${value}`);
            if (field && field.type !== "file") {
                field.value = value;
            }
        });
        
        form.querySelector('[name="country"]').value = data.country;
        form.querySelector('[name="department"]').value = data.department;
        form.querySelector('[name="province"]').value = data.province;
        const photoElement = document.getElementById('photo-preview');
        if (photoElement) {
        photoElement.src = data.photo;
        }
        // Cambiar acción del formulario y modo
        form.setAttribute('action', `/dashboard/tecnicos/update/${techId}/`);
        form.dataset.mode = 'edit';

        // Mostrar modal
        modalEdit.show();
    })
    .catch(error => {
        console.error('Error al cargar técnico:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos del técnico.'
        });
    });

    // PREVENIR doble suscripción al evento submit
    form.onsubmit = function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        formData.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        fetch(`/dashboard/tecnicos/update/${techId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) return response.json().then(data => Promise.reject(data));
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Técnico actualizado',
                text: data.message,
                timer: 3000,
                showConfirmButton: false
            });

            form.reset();
            modalEdit.hide();
            location.reload(); // o actualizar la tabla dinámicamente
        })
        .catch(error => {
            if (error.errors) {
                const errors = error.errors;
                let errorMessages = '';
                for (let field in errors) {
                    errors[field].forEach(e => {
                        errorMessages += `• ${e.message}\n`;
                    });
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Errores en el formulario',
                    text: errorMessages
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error inesperado',
                    text: 'No se pudo actualizar el técnico.'
                });
            }
        });
    };
}
// Obtiene el CSRF Token correctamente desde el input oculto
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

// Función para confirmar activación/desactivación de usuario
function confirmToggleUserStatus(userId, isActive) {
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