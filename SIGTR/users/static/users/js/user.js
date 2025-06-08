document.addEventListener('DOMContentLoaded', function () {
    const telefonoInput = document.getElementById('telefonoRegister');
    telefonoInput.addEventListener("input", function (event) {
        const inputValue = event.target.value;
        let numericValue = inputValue.replace(/[^0-9]/g, "");

        if (numericValue.length > 0 && numericValue[0] !== "9") {
            numericValue = "";
        } else {
            numericValue = numericValue.slice(0, 9);
        }
        event.target.value = numericValue;

        if (numericValue.length < 9) {
            event.target.setCustomValidity("Debes ingresar al menos 9 caracteres"); // Establecer el mensaje de validación
        } else {
            event.target.setCustomValidity(""); // Restablecer el mensaje de validación
        }

        event.target.value = numericValue;
    });
});