let audio = document.getElementById('audioRobot');
let video = document.getElementById('robotGIF');
let videOjos = document.getElementById('robotGIFOjos');
audio.muted = true;  // para evitar bloqueo
$(document).ready(function () {
    //tercera columna
    const robotImg = document.getElementById("robotimg");
    const videoRobot = document.getElementById("video-container");
    const videoRobotInput = document.getElementById("video-container2");
    const input = document.querySelector('.textIA');

    $("#robotimg").on('click', function () {
        audio.muted = false;
        audio.play();
        video.play();
        videoRobot.style.display = "flex";
        robotImg.style.display = "none";
    });
    video.addEventListener('ended', function () {
        videoRobot.style.display = "none";
        robotImg.style.display = "flex";
    });
    input.addEventListener('input', function () {
        if (input.value.trim() !== '') {
            videOjos.play();
            videoRobotInput.style.display ="flex";
            robotImg.style.display = "none";
        } else {
            videOjos.pause();
            videOjos.currentTime = 0;
            videoRobotInput.style.display ="none";
            robotImg.style.display = "flex";
        }
    })
    /*BARRA DE PROGRESO 5 COLUMNA*/
    const spans = document.querySelectorAll('.progress-bar span');
    spans.forEach((span) => {
        span.style.width = span.dataset.width;
        span.innerHTML = span.dataset.width;
    });
});

