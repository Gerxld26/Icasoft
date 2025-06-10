
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

        fetch("/dashboard/categories/create/", {
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
                    title: 'Categoría agregada',
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
            fetch(`/dashboard/categories/delete/${categoryId}/`, {
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
                    Swal.fire('Error', 'Ocurrió un error al eliminar la categoría.', 'error');
                });
        }
    });
}
