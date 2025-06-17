
// document.addEventListener('DOMContentLoaded', function () {
//     const modalElementP = document.getElementById('addProductModal');
//     const formProduct = document.getElementById('add-product-form');

//     modalElementP.addEventListener('show.bs.modal', function () {
//         formProduct.reset();
//     });
//     addProduct();
//     tooltips();
// });

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('add-product-form');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(`/dashboard/products/crud/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                body: formData
            });

            const data = await response.json();
            console.log('data:', data);
            if (response.ok && data.success) {
                alert(data.message);
                // Cierra el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                modal.hide();
                // Opcional: recarga la página o actualiza tabla vía AJAX
                location.reload();
            } else {
                // Mostrar errores
                const errors = JSON.parse(data.errors);
                for (const [field, errorList] of Object.entries(errors)) {
                    const fieldElement = document.getElementById(`id_${field}`);
                    if (fieldElement) {
                        let errorDiv = document.createElement('div');
                        errorDiv.classList.add('text-danger');
                        errorDiv.textContent = errorList.map(e => e.message).join(', ');
                        fieldElement.parentNode.appendChild(errorDiv);
                    }
                }
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
        }
    });
});

// function getCSRFToken() {
//     return document.querySelector("[name=csrfmiddlewaretoken]").value;
// }
// // Agregar categoria:
// function addProduct() {
//     const form = document.getElementById('add-product-form');
//     const modalElement = document.getElementById('addProductModal');
//     const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

//     // form.addEventListener('submit', function (e) {
//     //     e.preventDefault();
//     //     if (!form.checkValidity()) {
//     //         form.reportValidity();
//     //         return;
//     //     }

//     //     const formData = new FormData(form);
//     //     formData.append('action', 'create'); 
//     //     const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

//     //     fetch("/dashboard/categories/crud/", {
//     //         method: 'POST',
//     //         headers: {
//     //             'X-CSRFToken': csrfToken,
//     //             'X-Requested-With': 'XMLHttpRequest'
//     //         },
//     //         body: formData
//     //     })
//     //     .then(response => {
//     //         if (!response.ok) return response.json().then(data => Promise.reject(data));
//     //         return response.json();
//     //     })
//     //     .then(data => {
//     //         Swal.fire({
//     //             icon: 'success',
//     //             title: 'Éxito',
//     //             text: data.message,
//     //             timer: 3000,
//     //             showConfirmButton: false
//     //         }).then(() => {
//     //             location.reload();
//     //         });
//     //         form.reset();
//     //         modal.hide();
//     //     })
//     //     .catch(error => {
//     //         console.error("Error en la petición:", error);
//     //     });
//     // });
// }