const closeNotifications = document.querySelector('.close-btn');
const message = document.createElement('div');
const success = document.createElement('div');
const danger = document.createElement('div');

notification = [
    message, success, danger
];
notification.array.forEach(element => {
    element.classList.add("notification");
});
message.classList.add("info");
success.classList.add("success");
danger.classList.add("danger");

message.innerHTML = `
<div>
    <span class= "material-symbols-outlined icon">chat_bubble</span>
    <div>
        <h3>Éxito</h3>
        <p>Se ha realizado exitosamente</p>
    </div>
    <span class= "material-symbols-outlined close-btn">close</span>
</div>`
success.innerHTML = `
<div>
    <span class= "material-symbols-outlined icon">done</span>
    <div>
        <h3>Éxito</h3>
        <p>Se ha realizado exitosamente</p>
    </div>
    <span class= "material-symbols-outlined close-btn">close</span>
</div>`
danger.innerHTML = `
<div>
    <span class= "material-symbols-outlined icon">peligro</span>
    <div>
        <h3>Error</h3>
        <p>Hubo un error al actualizar</p>
    </div>
    <span class= "material-symbols-outlined close-btn">close</span>
</div>`