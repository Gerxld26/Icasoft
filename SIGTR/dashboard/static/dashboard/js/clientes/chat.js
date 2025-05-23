$(document).ready(function() {
    // Elementos del DOM
    const $textInput = $('#textIAID');
    const $sendButton = $('#sendChat');
    const $bodyChat = $('#body-chat');
    const $asistenteSoporte = $('#asistenteSoporte');
    const audioButton = document.getElementById('audioSend');
    const sendChat = document.getElementById('sendChat');
    const audioSend = document.getElementById('audioSend');
    
    // Variables para grabación de audio
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    
    // Funciones del chat
    function addMessage(message, type = 'user') {
        const messageElement = $('<div>', {
            class: `mensaje ${type === 'user' ? 'mensaje-usuario userRequest' : 'mensaje-asistente iaResponse'}`,
            text: message
        });
        
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
            success: function(response) {
                setTimeout(() => {
                    addMessage(response.response, 'assistant');
                }, 500);
            },
            error: function() {
                addMessage('Hubo un problema al procesar tu solicitud.', 'assistant');
            }
        });
    }
    
    function sendMessage() {
        const message = $textInput.val().trim();
        
        if (message === "") return;
        
        handleUserInput(message);
        $textInput.val('');
        $asistenteSoporte.addClass('modo-chat-activo');
    }
    
    // Event listeners para el chat
    $sendButton.on('click', sendMessage);
    
    $textInput.on('input', function() {
        const mensaje = $(this).val().trim();
        
        if (mensaje === "") {
            $asistenteSoporte.removeClass('modo-chat-activo');
            sendChat.style.display = 'none';
            audioSend.style.display = 'inline';
        } else {
            $asistenteSoporte.addClass('modo-chat-activo');
            sendChat.style.display = 'grid';
            audioSend.style.display = 'none';
        }
    });
    
    $textInput.on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Funciones de reconocimiento de voz (speech to text)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        $(audioButton).on('click', function() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    } else {
        $(audioButton).prop('disabled', true);
    }
    
    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioButton.innerHTML = '<i class="fa-solid fa-microphone microfono fa-beat" style="color: #ff0000;"></i>';
                $textInput.attr('placeholder', 'Hablando...');
                isRecording = true;
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
                
                setTimeout(() => {
                    if (isRecording) {
                        stopRecording();
                    }
                }, 10000);
            })
            .catch(error => {
                isRecording = false;
                audioButton.innerHTML = '<i class="fa-solid fa-microphone microfono"></i>';
                $textInput.attr('placeholder', 'Envía un mensaje a ICASOFT IA');
                alert('No se pudo acceder al micrófono. Verifica los permisos de tu navegador.');
            });
    }
    
    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            audioButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            $textInput.attr('placeholder', 'Transcribiendo...');
        }
    }
    
    function sendAudioToServer(audioBlob) {
        const assemblyApiKey = 'c54e681bb94b4567bf459442edc91168';
        
        fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'authorization': assemblyApiKey
            },
            body: audioBlob
        })
        .then(response => response.json())
        .then(data => {
            const uploadUrl = data.upload_url;
            
            fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    'authorization': assemblyApiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: uploadUrl,
                    language_code: 'es'
                })
            })
            .then(response => response.json())
            .then(transcriptData => {
                const transcriptId = transcriptData.id;
                checkTranscriptionStatus(transcriptId, assemblyApiKey);
            })
            .catch(error => {
                finishRecording(false);
            });
        })
        .catch(error => {
            finishRecording(false);
        });
    }
    
    function checkTranscriptionStatus(transcriptId, apiKey) {
        const checkInterval = setInterval(() => {
            fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'authorization': apiKey
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'completed') {
                    clearInterval(checkInterval);
                    
                    if (data.text && data.text.trim() !== '') {
                        $textInput.val(data.text);
                        
                        // Importante: Asegurar que el chat se active antes de enviar el mensaje
                        $asistenteSoporte.addClass('modo-chat-activo');
                        
                        // Actualizar la visualización de los botones
                        sendChat.style.display = 'grid';
                        audioSend.style.display = 'none';
                        
                        // Pequeño retraso para que los cambios visuales sean perceptibles
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
            .catch(error => {
                clearInterval(checkInterval);
                finishRecording(false);
            });
        }, 1000);
        
        // Establecer un límite de tiempo para la transcripción
        setTimeout(() => {
            clearInterval(checkInterval);
            finishRecording(false);
        }, 30000);
    }
    
    function finishRecording(success) {
        audioButton.innerHTML = '<i class="fa-solid fa-microphone microfono"></i>';
        
        if (!success) {
            $textInput.attr('placeholder', 'Error de transcripción. Intenta de nuevo.');
            setTimeout(() => {
                $textInput.attr('placeholder', 'Envía un mensaje a ICASOFT IA');
            }, 3000);
        } else {
            $textInput.attr('placeholder', 'Envía un mensaje a ICASOFT IA');
        }
    }
});