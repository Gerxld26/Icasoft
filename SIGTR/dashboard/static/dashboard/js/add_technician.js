document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos select del formulario
    const countrySelect = document.getElementById('country');
    const departmentSelect = document.getElementById('department');
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('city');

    // Función para limpiar y deshabilitar selects dependientes
    function resetSelect(selectElement, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        selectElement.disabled = true;
    }

    // Función para llenar un select con datos
    function populateSelect(selectElement, data, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.code || item; // Si es un objeto, usa el código; si es un string, usa el valor directamente.
            option.textContent = item.name || item;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    }

    // Función para realizar solicitudes fetch
    async function fetchData(url, errorMessage) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            alert(error.message);
            return [];
        }
    }

    // Evento para cargar departamentos cuando se selecciona un país
    countrySelect.addEventListener('change', async () => {
        const selectedCountry = countrySelect.value;
        resetSelect(departmentSelect, 'Seleccione un departamento');
        resetSelect(provinceSelect, 'Seleccione una provincia');
        resetSelect(districtSelect, 'Seleccione un distrito');

        if (selectedCountry) {
            const data = await fetchData(
                `/dashboard/load-departments/?country=${selectedCountry}`,
                'Error al cargar departamentos'
            );
            populateSelect(departmentSelect, data, 'Seleccione un departamento');
        }
    });

    // Evento para cargar provincias cuando se selecciona un departamento
    departmentSelect.addEventListener('change', async () => {
        const selectedDepartment = departmentSelect.value;
        resetSelect(provinceSelect, 'Seleccione una provincia');
        resetSelect(districtSelect, 'Seleccione un distrito');

        if (selectedDepartment) {
            const selectedCountry = countrySelect.value;
            const data = await fetchData(
                `/dashboard/load-provinces/?country=${selectedCountry}&department=${selectedDepartment}`,
                'Error al cargar provincias'
            );
            populateSelect(provinceSelect, data, 'Seleccione una provincia');
        }
    });

    // Evento para cargar distritos cuando se selecciona una provincia
    provinceSelect.addEventListener('change', async () => {
        const selectedProvince = provinceSelect.value;
        resetSelect(districtSelect, 'Seleccione un distrito');

        if (selectedProvince) {
            const selectedCountry = countrySelect.value;
            const data = await fetchData(
                `/dashboard/load-districts/?country=${selectedCountry}&province=${selectedProvince}`,
                'Error al cargar distritos'
            );
            populateSelect(districtSelect, data, 'Seleccione un distrito');
        }
    });

    // Cargar países al cargar la página
    (async () => {
        const data = await fetchData('/dashboard/load-countries/', 'Error al cargar países');
        populateSelect(countrySelect, data, 'Seleccione un país');
    })();
});
