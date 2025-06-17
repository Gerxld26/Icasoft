
document.addEventListener('DOMContentLoaded', function () {
    const modalElementC = document.getElementById('addCategoryModal');
    const formCategory = document.getElementById('add-category-form');

    modalElementC.addEventListener('show.bs.modal', function () {
        formCategory.reset();
    });
    addCategory();
    tooltips();
});
function getCSRFToken() {
    return document.querySelector("[name=csrfmiddlewaretoken]").value;
}
// Agregar categoria:
function addCategory() {
    const form = document.getElementById('add-category-form');
    const modalElement = document.getElementById('addCategoryModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('action', 'create'); 
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch("/dashboard/categories/crud/", {
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
                title: 'Éxito',
                text: data.message,
                timer: 3000,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
            form.reset();
            modal.hide();
        })
        .catch(error => {
            console.error("Error en la petición:", error);
        });
    });
}
function editCategory(categoryId) {
    const form = document.getElementById('edit-category-form');
    const modalElementEdit = document.getElementById('editCategoryModal');
    const modalEdit = bootstrap.Modal.getOrCreateInstance(modalElementEdit);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // GET: obtener datos
    fetch(`/dashboard/categories/crud/${categoryId}/?action=update`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && field.type !== "file") {
                field.value = value;
            }
        });
        form.setAttribute('data-id', categoryId);
        modalEdit.show();
    })
    .catch(error => {
        console.error('Error al cargar datos de la categoría:', error);
    });

    form.onsubmit = function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        formData.append('action', 'update');

        fetch(`/dashboard/categories/crud/${categoryId}/`, {
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
                title: 'Éxito',
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
            console.error('Error al actualizar la categoría:', error);
        });
    };
}
// Eliminar categoria:
function deleteCategory(categoryId) {
    Swal.fire({
        title: '¿Estás seguro de eliminar esta categoría?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!'
    }).then((result) => {
        if (result.isConfirmed) {
            const csrfToken = getCSRFToken();
            const formData = new URLSearchParams();
            formData.append('action', 'delete');

            fetch(`/dashboard/categories/crud/${categoryId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire('¡Éxito!', data.message, 'success').then(() => location.reload());
                } else {
                    Swal.fire('Aviso', data.message, 'warning');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar la categoría.', 'error');
            });
        }
    });
}
