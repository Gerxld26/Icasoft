document.addEventListener('DOMContentLoaded', function() {
    const modalRecomendaciones = document.getElementById('modalRecomendaciones');
    const openModalRecomendaciones = document.getElementById('btnVerCompleto');
    const closeModalRecomendaciones = document.getElementById('closeModalRecom');

    if (openModalRecomendaciones) {
        openModalRecomendaciones.addEventListener('click', function () {
            modalRecomendaciones.style.display = 'flex';
            loadProducts();
        });
    }

    if (closeModalRecomendaciones) {
        closeModalRecomendaciones.addEventListener('click', function () {
            modalRecomendaciones.style.display = 'none';
        });
    }

    if (modalRecomendaciones) {
        window.addEventListener('click', function (event) {
            if (event.target == modalRecomendaciones) {
                modalRecomendaciones.style.display = 'none';
            }
        });
    }

    function loadProducts() {
        fetch('/dashboard/client/recommendations/api/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                const securityContainer = document.querySelector('#modalRecomendaciones .apartado:nth-child(1) .contentApartado');
                const microsoftContainer = document.querySelector('#modalRecomendaciones .apartado:nth-child(2) .contentApartado');
                
                if (securityContainer && data.security) {
                    securityContainer.innerHTML = '';
                    data.security.forEach(product => {
                        const productHTML = createProductHTML(product);
                        securityContainer.innerHTML += productHTML;
                    });
                }
                
                if (microsoftContainer && data.microsoft) {
                    microsoftContainer.innerHTML = '';
                    data.microsoft.forEach(product => {
                        const productHTML = createProductHTML(product);
                        microsoftContainer.innerHTML += productHTML;
                    });
                }
                
                document.querySelectorAll('.btnComprar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const productId = this.getAttribute('data-product-id');
                        addToCart(productId);
                    });
                });
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
            });
    }

    function createProductHTML(product) {
        if (!product || !product.nombre) return '';
        
        const imagen = product.imagen || '/static/dashboard/img/product-placeholder.webp';
        const precio = typeof product.precio === 'number' ? product.precio.toFixed(2) : '0.00';
        
        return `
            <div class="productSW">
                <div class="detalleProducto">
                    <div class="contentImg"><img src="${imagen}" alt="${product.nombre}" class="imgSW"></div>
                    <div class="nombreProducto">
                        <div class="textProducto">${product.nombre}</div>
                        <div class="precioProducto">s/. ${precio}</div>
                    </div>
                </div>
                <div class="opciones">
                    <button class="btnComprar" data-product-id="${product.id}">COMPRAR</button>
                </div>
            </div>
        `;
    }

    function addToCart(productId) {
        if (!productId) return;
        
        const formData = new FormData();
        formData.append('cantidad', 1);
        
        fetch(`/dashboard/client/cart/add/${productId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    title: 'Producto agregado',
                    text: 'El producto se ha agregado a tu carrito',
                    icon: 'success',
                    confirmButtonText: 'Continuar'
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'Ha ocurrido un error',
                    icon: 'error',
                    confirmButtonText: 'Cerrar'
                });
            }
        })
        .catch(error => {
            console.error('Error agregando al carrito:', error);
        });
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});