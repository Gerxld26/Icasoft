$(document).ready(function () {
    const $textInput = $('#textIAID');
    const $sendButton = $('#sendChat');
    const $bodyChat = $('#body-chat');
    const $asistenteSoporte = $('#asistenteSoporte');

    const mensajeIA = document.getElementById('mensajeIA');
    const divChatAudio = document.getElementById('contentFooterAudio');
    const divChatText = document.getElementById('contentFootertext');
    const imgIa = document.getElementById('robotimg');
    const videoHablando = document.getElementById('video-container');
    const videoOjos = document.getElementById('video-container2');
    const robotGIF = document.getElementById('robotGIF');
    const robotGIFOjos = document.getElementById('robotGIFOjos');

    const sendChat = document.getElementById('sendChat');
    const audioSend = document.getElementById('audioSend');
    const audioSendText = document.getElementById('audioSendText')
    const $mostrarChat = $('#mostrarChat');
    const $cerrarChat = $('#cerrarChat');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    function mostrarEstadoIA(estado) {
        if (estado === 'escuchando') {
            videoOjos.style.display = 'flex';
            videoHablando.style.display = 'none';
        } else if (estado === 'hablando') {
            videoHablando.style.display = 'flex';
            videoOjos.style.display = 'none';
        } else {
            videoHablando.style.display = 'none';
            videoOjos.style.display = 'flex';
        }
    }

    function formatMarkdownToHTML(text) {
        if (!text) return text;

        return text
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<u>$1</u>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function cleanTextForSpeech(text) {
        if (!text) return text;

        return text
            .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/[#\-\+\[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function speakText(text) {
        const cleanedText = cleanTextForSpeech(text);
        // Si el chat está en modo activo, no hablar
        if ($asistenteSoporte.hasClass('modo-chat-activo')) {
            return;
        }

        function loadAndSpeak() {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find(v =>
                v.name.includes("Google español") ||
                v.name.includes("Microsoft Sabina") ||
                v.name.includes("es-ES") && v.gender === "female"
            );

            const utterance = new SpeechSynthesisUtterance(cleanedText);
            utterance.voice = selectedVoice || voices[0];
            utterance.lang = "es-ES";
            utterance.rate = 1.1;
            utterance.pitch = 1.3;

            // Mostrar y reproducir el video mientras habla
            // Mostrar hablando
            mostrarEstadoIA('hablando');
            imgIa.style.display = 'none';

            robotGIF.currentTime = 0;
            robotGIF.muted = true;
            robotGIF.play().catch(e => {
                console.warn("No se pudo reproducir el video:", e);
            });

            utterance.onend = () => {
                robotGIF.pause();
                robotGIF.currentTime = 0;
                mostrarEstadoIA();
                //videoHablando.style.display = 'none';
                imgIa.style.display = 'none';

                //videoOjos.style.display = 'flex';
                robotGIFOjos.currentTime = 0;
                robotGIFOjos.muted = true;
                robotGIFOjos.play().catch(e => {
                    console.warn("No se pudo reproducir el video:", e);
                });
            };

            speechSynthesis.speak(utterance); // Solo se habla si no está en modo-chat-activo
        }

        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.onvoiceschanged = loadAndSpeak;
        } else {
            loadAndSpeak();
        }
    }

    function addMessage(message, type = 'user') {
        let displayMessage = message;

        if (type === 'assistant') {
            displayMessage = formatMarkdownToHTML(message);
        }

        const messageElement = $('<div>', {
            class: `mensaje ${type === 'user' ? 'mensaje-usuario userRequest' : 'mensaje-asistente iaResponse'}`
        });

        if (type === 'assistant') {
            messageElement.html(displayMessage);
        } else {
            messageElement.text(displayMessage);
        }

        $bodyChat.append(messageElement);
        scrollToBottom();
        return messageElement;
    }

    function scrollToBottom() {
        $bodyChat.scrollTop($bodyChat[0].scrollHeight);
    }

    function handleUserInput(userInput) {
        addMessage(userInput);

        $.ajax({
            url: '/dashboard/chatIA/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: userInput }),
            success: function (response) {
                setTimeout(() => {
                    addMessage(response.response, 'assistant');
                    speakText(response.response);
                }, 500);
            },
            error: function () {
                const errorMessage = 'Hubo un problema al procesar tu solicitud.';
                addMessage(errorMessage, 'assistant');
                speakText(errorMessage);
            }
        });
    }

    function sendMessage() {
        const message = $textInput.val().trim();

        if (message === "") return;

        handleUserInput(message);
        $textInput.val('');
        // $asistenteSoporte.addClass('modo-chat-activo');
    }

    $cerrarChat.on('click', function () {
        $asistenteSoporte.removeClass('modo-chat-activo');
        imgIa.style.display = 'flex';
        videoHablando.style.display = 'none';
        videoOjos.style.display = 'none';
        sendChat.style.display = 'none';
        audioSend.style.display = 'inline';
        speechSynthesis.cancel();
    });

    $mostrarChat.on('click', function () {
        speechSynthesis.cancel(); // Detener voz activa
        $asistenteSoporte.addClass('modo-chat-activo');
        divChatAudio.style.display = 'none';
        divChatText.style.display = 'grid';
        mensajeIA.style.background = 'linear-gradient(180deg, #85c9df, rgb(2 147 205), #b6e1ef)';
    });

    $sendButton.on('click', sendMessage);

    $textInput.on('input', function () {
        const mensaje = $(this).val().trim();

        if (mensaje === "") {
            sendChat.style.display = 'none';
            audioSendText.style.display = 'inline';
        } else {
            $asistenteSoporte.addClass('modo-chat-activo');
            sendChat.style.display = 'grid';
            audioSendText.style.display = 'none';
        }
    });

    $textInput.on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        $(audioSendText).on('click', function () {
            if (!isRecording) {
                isRecording = true;

                // Mostrar estado previo a grabación
                divChatAudio.style.display = 'flex';
                divChatText.style.display = 'none';
                mensajeIA.style.background = 'none';
                imgIa.style.display = 'none';
                videoOjos.style.display = 'flex';
                videoHablando.style.display = 'none';

                // Mostrar ícono de grabando (esperando permiso)
                audioSend.innerHTML = '<i class="fa-solid fa-microphone microfono fa-beat" style="color: #ff0000;"></i>';
                $asistenteSoporte.removeClass('modo-chat-activo');
                startRecording();
            }
        });
        $(audioSend).on('click', function () {
            if (!isRecording) {
                isRecording = true;

                // Mostrar estado previo a grabación
                divChatAudio.style.display = 'flex';
                divChatText.style.display = 'none';
                mensajeIA.style.background = 'none';
                imgIa.style.display = 'none';
                videoOjos.style.display = 'flex';
                videoHablando.style.display = 'none';

                // Mostrar ícono de grabando (esperando permiso)
                audioSend.innerHTML = '<i class="fa-solid fa-microphone microfono fa-beat" style="color: #ff0000;"></i>';

                startRecording();
            }
        });
    } else {
        $(audioSendText).prop('disabled', true);
        $(audioSend).prop('disabled', true);
    }

    function startRecording() {
        // MOSTRAR ESCUCHANDO (grabando)
        mostrarEstadoIA('escuchando');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    sendAudioToServer(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();

                // Cortar grabación automáticamente a los 10 segundos
                setTimeout(() => {
                    if (isRecording) stopRecording();
                }, 10000);
            })
            .catch(error => {
                isRecording = false;
                audioSend.innerHTML = '<i class="fa-solid fa-microphone microfono"></i>';
                alert('No se pudo acceder al micrófono. Verifica los permisos de tu navegador.');
            });
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;

            // Mientras transcribe, volver al estado de espera
            mostrarEstadoIA(); 
            divChatAudio.style.display = 'flex';
            divChatText.style.display = 'none';
            mensajeIA.style.background = 'none';
            imgIa.style.display = 'none';
        }
    }

    function sendAudioToServer(audioBlob) {
        const assemblyApiKey = 'c54e681bb94b4567bf459442edc91168';

        fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: { 'authorization': assemblyApiKey },
            body: audioBlob
        })
            .then(response => response.json())
            .then(data => {
                const uploadUrl = data.upload_url;

                return fetch('https://api.assemblyai.com/v2/transcript', {
                    method: 'POST',
                    headers: {
                        'authorization': assemblyApiKey,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        audio_url: uploadUrl,
                        language_code: 'es'
                    })
                });
            })
            .then(response => response.json())
            .then(transcriptData => {
                const transcriptId = transcriptData.id;
                checkTranscriptionStatus(transcriptId, assemblyApiKey);
            })
            .catch(() => {
                finishRecording(false);
            });
    }

    function checkTranscriptionStatus(transcriptId, apiKey) {
        const checkInterval = setInterval(() => {
            fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: { 'authorization': apiKey }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'completed') {
                        clearInterval(checkInterval);

                        if (data.text && data.text.trim() !== '') {
                            $textInput.val(data.text);

                            // Mostrar solo "hablando" al responder
                            divChatAudio.style.display = 'flex';
                            divChatText.style.display = 'none';
                            mensajeIA.style.background = 'none';
                            imgIa.style.display = 'none';
                            videoHablando.style.display = 'flex';
                            videoOjos.style.display = 'none';

                            setTimeout(() => {
                                sendMessage();
                            }, 300);
                        }

                        finishRecording(true);
                    } else if (data.status === 'error') {
                        clearInterval(checkInterval);
                        finishRecording(false);
                    }
                })
                .catch(() => {
                    clearInterval(checkInterval);
                    finishRecording(false);
                });
        }, 1000);

        setTimeout(() => {
            clearInterval(checkInterval);
            finishRecording(false);
        }, 30000);
    }

    function finishRecording(success) {
        audioSend.innerHTML = '<i class="fa-solid fa-microphone microfono"></i>';
        divChatAudio.style.display = 'flex';
        divChatText.style.display = 'none';
        mensajeIA.style.background = 'none';
        imgIa.style.display = 'none';
        mostrarEstadoIA(); 
    }
});