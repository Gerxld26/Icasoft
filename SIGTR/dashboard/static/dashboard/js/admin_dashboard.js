document.addEventListener("DOMContentLoaded", () => { 
    const dashboardDataElement = document.getElementById("dashboard-data");
    let dashboardData = {};

    // Parse JSON data safely
    if (dashboardDataElement) {
        try {
            dashboardData = JSON.parse(dashboardDataElement.textContent);
            console.log("Datos del dashboard:", dashboardData);  // Ver los datos en consola
        } catch (error) {
            console.error("Error al analizar los datos del dashboard:", error);
            dashboardData = {
                techniciansCount: 0,
                clientsCount: 0,
                adminsCount: 0,
                ticketsCount: 0,
                ticketsPerMonth: {},
                casesByTechnician: {},
            };
        }
    }

    const charts = {}; // Store chart instances for destruction later

    // Function to destroy a chart instance if it exists
    const destroyChart = (chartId) => {
        if (charts[chartId]) {
            charts[chartId].destroy();
            delete charts[chartId];
        }
    };

    // Fetching and applying the filter data
    const applyFilters = () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const technician = document.getElementById('technicianSelect').value;

        // Filter tickets per month based on the selected date range
        let filteredTicketsPerMonth = dashboardData.ticketsPerMonth;
        if (startDate || endDate) {
            filteredTicketsPerMonth = filterDataByDateRange(dashboardData.ticketsPerMonth, startDate, endDate);
        }

        // Filter cases by technician if a technician is selected
        let filteredCasesByTechnician = dashboardData.casesByTechnician;
        if (technician) {
            filteredCasesByTechnician = filterDataByTechnician(dashboardData.casesByTechnician, technician);
        }

        // Re-render charts with the filtered data
        renderGeneralChart();
        renderMonthlyTicketsChart(filteredTicketsPerMonth);
        renderTechniciansCasesChart(filteredCasesByTechnician);
    };

    // Helper functions to filter data by date range and technician
    const filterDataByDateRange = (data, startDate, endDate) => {
        const filteredData = {};
        for (const [key, value] of Object.entries(data)) {
            // Convert the date string to Date object
            const date = new Date(key); 
            
            // Apply the date filters
            if (
                (startDate && date >= new Date(startDate)) && 
                (endDate && date <= new Date(endDate))
            ) {
                filteredData[key] = value;
            }
        }
        return filteredData;
    };

    const filterDataByTechnician = (data, technician) => {
        const filteredData = {};
        if (data[technician]) {
            filteredData[technician] = data[technician];
        }
        return filteredData;
    };

    // General Chart
    const renderGeneralChart = () => {
        const generalCtx = document.getElementById("generalChart");
        if (generalCtx) {
            destroyChart("generalChart");
            charts["generalChart"] = new Chart(generalCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Administradores", "Técnicos", "Clientes", "Tickets"],
                    datasets: [
                        {
                            label: "Cantidad",
                            data: [
                                dashboardData.adminsCount || 0,
                                dashboardData.techniciansCount || 0,
                                dashboardData.clientsCount || 0,
                                dashboardData.ticketsCount || 0,
                            ],
                            backgroundColor: ["#007bff", "#17a2b8", "#28a745", "#ffc107"],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true, position: "top" },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1, // Asegura que los valores sean enteros
                                callback: function (value) {
                                    return Number.isInteger(value) ? value : null;
                                },
                            },
                        },
                    },
                },
            });
        }
    };

    // Monthly Tickets Chart
    const renderMonthlyTicketsChart = (filteredData) => {
        const monthlyCtx = document.getElementById("monthlyTicketsChart");
        if (monthlyCtx) {
            destroyChart("monthlyTicketsChart");
            const labels = Object.keys(filteredData || {});
            const values = Object.values(filteredData || {});
            if (labels.length && values.length) {
                charts["monthlyTicketsChart"] = new Chart(monthlyCtx.getContext("2d"), {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: "Tickets por Mes",
                                data: values,
                                borderColor: "#ffc107",
                                backgroundColor: "rgba(255,193,7,0.2)",
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: true, position: "top" },
                        },
                        scales: { y: { beginAtZero: true } },
                    },
                });
            } else {
                monthlyCtx.parentNode.innerHTML =
                    "<p class='text-center'>No hay datos de tickets por mes.</p>";
            }
        }
    };

    // Technicians Cases Chart
    const renderTechniciansCasesChart = (filteredData) => {
        const technicianCtx = document.getElementById("techniciansCasesChart");
        if (technicianCtx) {
            destroyChart("techniciansCasesChart");
            const labels = Object.keys(filteredData || {});
            const values = Object.values(filteredData || {});
            if (labels.length && values.length) {
                charts["techniciansCasesChart"] = new Chart(technicianCtx.getContext("2d"), {
                    type: "bar", // Changed to bar chart for better visualization
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: "Casos por Técnico",
                                data: values,
                                backgroundColor: [
                                    "#007bff",
                                    "#dc3545",
                                    "#28a745",
                                    "#ffc107",
                                    "#17a2b8",
                                ],
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: true, position: "top" },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 },
                            },
                        },
                    },
                });
            } else {
                technicianCtx.parentNode.innerHTML =
                    "<p class='text-center'>No hay datos de casos por técnico.</p>";
            }
        }
    };

    // Apply the filters on initial load
    document.getElementById('applyFilter').addEventListener('click', applyFilters);

    // Initial render
    renderGeneralChart();
    renderMonthlyTicketsChart(dashboardData.ticketsPerMonth);
    renderTechniciansCasesChart(dashboardData.casesByTechnician);
});


// Alertas
document.addEventListener('DOMContentLoaded', function () {
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    if (successMessage) {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: successMessage.getAttribute('data-message'),
            timer: 3000,
            showConfirmButton: false
        });
    }

    if (errorMessage) {
        Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: errorMessage.getAttribute('data-message'),
            timer: 3000,
            showConfirmButton: false
        });
    }
});

// Cargar datos de ubicación
document.addEventListener("DOMContentLoaded", function () {
    const countrySelect = document.getElementById("country");
    const departmentSelect = document.getElementById("department");
    const provinceSelect = document.getElementById("province");

    function resetSelect(selectElement, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        selectElement.disabled = true;
    }

    function populateSelect(selectElement, data, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        data.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.code || item.name || item;
            option.textContent = item.name || item;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    }

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

    countrySelect.addEventListener("change", async function () {
        const selectedCountry = this.value;

        resetSelect(departmentSelect, "Seleccione un departamento");
        resetSelect(provinceSelect, "Seleccione una provincia");

        if (selectedCountry) {
            const data = await fetchData(
                `/dashboard/load-departments/?country=${selectedCountry}`,
                "Error al cargar departamentos"
            );
            populateSelect(departmentSelect, data, "Seleccione un departamento");
        }
    });

    departmentSelect.addEventListener("change", async function () {
        const selectedDepartment = this.value;
        const selectedCountry = countrySelect.value;

        resetSelect(provinceSelect, "Seleccione una provincia");

        if (selectedDepartment && selectedCountry) {
            const data = await fetchData(
                `/dashboard/load-provinces/?country=${selectedCountry}&department=${selectedDepartment}`,
                "Error al cargar provincias"
            );
            populateSelect(provinceSelect, data, "Seleccione una provincia");
        }
    });

    async function loadCountries() {
        const data = await fetchData(
            "/dashboard/load-countries/",
            "Error al cargar países"
        );
        populateSelect(countrySelect, data, "Seleccione un país");
    }

    loadCountries();
});

// Ver contraseña
document.addEventListener('DOMContentLoaded', function () {
    const togglePasswordButton = document.getElementById('toggle-password-visibility');
    const passwordField = document.querySelector('input[name="password"]');
    const passwordIcon = document.getElementById('password-icon');

    if (togglePasswordButton && passwordField && passwordIcon) {
        togglePasswordButton.addEventListener('click', function () {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                passwordIcon.classList.remove('fa-eye');
                passwordIcon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                passwordIcon.classList.remove('fa-eye-slash');
                passwordIcon.classList.add('fa-eye');
            }
        });
    }
});

// Fetch online users count
async function fetchOnlineUsersCount() {
    try {
        const response = await fetch('/dashboard/online-users/');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        document.getElementById('online-users-count').textContent = data.count;
    } catch (error) {
        console.error('Error fetching online users count:', error);
    }
}

// Llama a la función al cargar la página
fetchOnlineUsersCount();
