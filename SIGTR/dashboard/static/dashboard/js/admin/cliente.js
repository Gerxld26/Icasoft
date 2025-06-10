document.addEventListener('DOMContentLoaded', function () {
    const modalElementClient = document.getElementById('addClientModal');
    const formClient = document.getElementById('add-client-form');

    modalElementClient.addEventListener('show.bs.modal', function () {
        formClient.reset();
    });
    addClient();
    tooltips();
    response();
});
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}
// Agregar cliente:
function addClient() {
    const form = document.getElementById('add-client-form');
    const modalElement = document.getElementById('addClientModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        //mostrar los tooltips del formulario 
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const formData = new FormData(form);
        formData.forEach((value, key) => {
            console.log(`${key}: ${value}`);
        });

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch("/dashboard/clientes/agregar/", {
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
                    title: 'Cliente agregado',
                    text: data.message,
                    timer: 5000,
                    showConfirmButton: false
                });
                form.reset();
                modal.hide();

            })
            .catch(error => {
                console.error("Error en la petición:", error);
            });
    });
}
function editClient(clientId) {
    const form = document.getElementById('edit-client-form');
    const modalElementEdit = document.getElementById('editClientModal');
    const modalEdit = bootstrap.Modal.getOrCreateInstance(modalElementEdit);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // GET: Cargar datos del cliente
    fetch(`/dashboard/clientes/update/${clientId}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            Object.entries(data).forEach(([key, value]) => {
                const field = form.querySelector(`[name="${key}"]`);
                console.log(`${key}: ${value}`);
                if (field && field.type !== "file") {
                    field.value = value;
                }
            });
            form.setAttribute('action', `/dashboard/clientes/update/${clientId}/`);
            form.dataset.mode = 'edit';
            modalEdit.show();
        })
        .catch(error => {
            console.error('Error al cargar datos del cliente:', error);
        });

    form.onsubmit = function (e) {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);

        fetch(`/dashboard/clientes/update/${clientId}/`, {
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
                    title: 'Cliente actualizado',
                    text: data.message,
                    timer: 3000,
                    showConfirmButton: false
                }).then(() => {
                    location.reload(); 
                });

                form.reset();
                modalEdit.hide();
            })
            .catch(error => {
                console.error('Error al actualizar cliente:', error);
            });
    };
}
// Función para confirmar activación/desactivación de usuario
function confirmToggleClientStatus(userId) {
    Swal.fire({
        title: '¿Estás seguro de eliminar este usuario?',
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
            Swal.fire('Error', 'Ocurrió un error al eliminar al usuario.', 'error');
        });
}