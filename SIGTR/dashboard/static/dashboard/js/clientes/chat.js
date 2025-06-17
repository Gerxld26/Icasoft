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
    let canceladoPorUsuario = false;

    function mostrarEstadoIA(estado) {
        if (estado === 'escuchando') {
            videoOjos.style.display = 'flex';
            videoHablando.style.display = 'none';
        } else if (estado === 'hablando') {
            videoHablando.style.display = 'flex';
            videoOjos.style.display = 'none';
        } else if (estado == 'ninguno') {
            videoHablando.style.display = 'none';
            videoOjos.style.display = 'none';
        } else {
            videoHablando.style.display = 'none';
            videoOjos.style.display = 'flex';
        }
    }

    let userContext = {};
    let isFirstInteraction = true;

    $mostrarChat.on('click', function () {
        if (isRecording) {
            canceladoPorUsuario = true;
            stopRecording();
        }
        speechSynthesis.cancel();
        $asistenteSoporte.addClass('modo-chat-activo');
        divChatAudio.style.display = 'none';
        divChatText.style.display = 'grid';
        mensajeIA.style.background = 'linear-gradient(180deg, #85c9df, rgb(2 147 205), #b6e1ef)';

        if (isFirstInteraction) {
            loadWelcomeMessage();
            isFirstInteraction = false;
        }
    });

    function loadWelcomeMessage() {
        $.ajax({
            url: '/dashboard/api/user/chat-context/',
            method: 'GET',
            success: function (response) {
                if (response.status === 'success') {
                    userContext = response.context;

                    setTimeout(() => {
                        addMessage(response.welcome_message, 'assistant');

                        if (userContext.suggestions && userContext.suggestions.length > 0) {
                            showSuggestions(userContext.suggestions);
                        }
                    }, 500);
                }
            },
            error: function () {
                setTimeout(() => {
                    addMessage('¡Hola! Soy tu asistente técnico de ICASOFT IA. ¿En qué puedo ayudarte hoy?', 'assistant');
                }, 500);
            }
        });
    }

    function showSuggestions(suggestions) {
        let suggestionsHtml = '<div class="chat-suggestions" style="margin-top: 15px;">';
        suggestionsHtml += '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Sugerencias rápidas:</div>';

        suggestions.forEach((suggestion, index) => {
            suggestionsHtml += `
                <button class="suggestion-btn" data-suggestion="${suggestion}" 
                        style="
                            background: linear-gradient(135deg, #007bff, #0056b3);
                            color: white;
                            border: none;
                            padding: 8px 12px;
                            margin: 3px;
                            border-radius: 15px;
                            font-size: 11px;
                            cursor: pointer;
                            transition: all 0.2s;
                            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                        ">
                    ${suggestion}
                </button>
            `;
        });

        suggestionsHtml += '</div>';

        const $lastMessage = $bodyChat.children().last();
        $lastMessage.append(suggestionsHtml);

        $lastMessage.find('.suggestion-btn').on('click', function () {
            const suggestion = $(this).data('suggestion');
            $textInput.val(suggestion);
            sendMessage();

            $(this).parent().fadeOut();
        });

        scrollToBottom();
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

                    // NUEVO: Actualizar contexto si viene en la respuesta
                    if (response.user_context) {
                        userContext = response.user_context;
                    }

                    // NUEVO: Mostrar sugerencias contextuales si las hay
                    if (userContext.suggestions && userContext.suggestions.length > 0 && Math.random() < 0.3) {
                        // 30% de probabilidad de mostrar sugerencias adicionales
                        showSuggestions(userContext.suggestions.slice(0, 2));
                    }
                }, 500);
            },
            error: function () {
                const errorMessage = 'Hubo un problema al procesar tu solicitud.';
                addMessage(errorMessage, 'assistant');
                speakText(errorMessage);
            }
        });
    }

    function enhanceUserMessage(message) {
        // Si el contexto indica que es usuario nuevo, agregar información útil
        if (userContext.is_first_time && !message.toLowerCase().includes('diagnóstico')) {
            return message + " (Nota: Soy un usuario nuevo)";
        }

        return message;
    }

    // MODIFICACIÓN: Función addMessage mejorada (opcional)
    function addMessage(message, type = 'user') {
        let displayMessage = message;

        if (type === 'assistant') {
            displayMessage = formatMarkdownToHTML(message);

            // NUEVO: Agregar emoji contextual al inicio (opcional)
            if (userContext.has_recent_issues && message.includes('problema')) {
                displayMessage = '⚠️ ' + displayMessage;
            } else if (message.includes('diagnóstico') || message.includes('escaneo')) {
                displayMessage = '🔍 ' + displayMessage;
            } else if (message.includes('hola') || message.includes('bienvenido')) {
                displayMessage = '👋 ' + displayMessage;
            }
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

    function showSystemStatus() {
        if (userContext.system_info && Object.keys(userContext.system_info).length > 0) {
            let statusMessage = `📊 **Estado de tu sistema:**\n`;
            statusMessage += `• SO: ${userContext.system_info.os || 'No disponible'}\n`;
            statusMessage += `• Procesador: ${userContext.system_info.cpu || 'No disponible'}\n`;
            statusMessage += `• RAM: ${userContext.system_info.ram || 'No disponible'}\n`;
            statusMessage += `• Estado general: ${userContext.system_info.status || 'No disponible'}`;

            addMessage(statusMessage, 'assistant');
        }
    }

    function formatMarkdownToHTML(text) {
        if (!text) return text;

        let formattedText = text.trim();

        formattedText = formattedText.replace(/[ \t]+/g, ' ');

        formattedText = formattedText
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<u>$1</u>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n\s*\n/g, '<br><br>')
            .replace(/\n/g, ' ');

        return formattedText;
    }

    function cleanTextForSpeech(text) {
        if (!text) return text;

        let cleanedText = text
            .replace(/<[^>]*>/g, '')
            .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/[#\-\+\[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return cleanedText;
    }

    function speakText(text) {
        const cleanedText = cleanTextForSpeech(text);
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

            speechSynthesis.speak(utterance);
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
            messageElement.css({
                'word-wrap': 'break-word',
                'word-break': 'break-word',
                'overflow-wrap': 'break-word',
                'white-space': 'pre-wrap',
                'line-height': '1.5',
                'max-width': '100%'
            });
        } else {
            messageElement.text(displayMessage);
            messageElement.css({
                'word-wrap': 'break-word',
                'word-break': 'break-word',
                'overflow-wrap': 'break-word',
                'white-space': 'pre-wrap',
                'line-height': '1.5',
                'max-width': '100%'
            });
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
    }

    $cerrarChat.on('click', function () {
        $asistenteSoporte.removeClass('modo-chat-activo');
        imgIa.style.display = 'flex';
        mostrarEstadoIA('ninguno');
        sendChat.style.display = 'none';
        audioSendText.style.display = 'inline';
        speechSynthesis.cancel();
    });

    $mostrarChat.on('click', function () {
        speechSynthesis.cancel();
        $asistenteSoporte.addClass('modo-chat-activo');
        divChatAudio.style.display = 'none !important';
        divChatText.style.display = 'grid !important';
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
                mostrarEstadoIA('escuchando');

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
                mostrarEstadoIA('escuchando');

                // Mostrar ícono de grabando al usuario
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

            mostrarEstadoIA();

            if (canceladoPorUsuario || $asistenteSoporte.hasClass('modo-chat-activo')) {
                canceladoPorUsuario = false; 
                return;
            }

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
        // Si estamos en modo chat, no cambiar nada visual
        if (canceladoPorUsuario || $asistenteSoporte.hasClass('modo-chat-activo')) {
            canceladoPorUsuario = false;
            return;
        }
        divChatAudio.style.display = 'flex';
        divChatText.style.display = 'none';
        mensajeIA.style.background = 'none';
        imgIa.style.display = 'none';
        mostrarEstadoIA();
    }

    const chatStyles = `
        <style id="chat-fix-styles">
        .chat-suggestions {
    max-width: 100%;
    text-align: left;
}

.suggestion-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,123,255,0.4) !important;
    background: linear-gradient(135deg, #0056b3, #004085) !important;
}

.suggestion-btn:active {
    transform: translateY(0);
}

.mensaje-asistente.personalized {
    background: linear-gradient(135deg, #e8f4f8, #d1ecf1);
    border-left: 4px solid #007bff;
}

.user-status-badge {
    display: inline-block;
    background: #28a745;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 5px;
}
        .mensaje {
            word-wrap: break-word !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: pre-wrap !important;
            line-height: 1.5 !important;
            max-width: 100% !important;
            padding: 12px 16px !important;
            margin: 8px 0 !important;
            border-radius: 12px !important;
            display: block !important;
        }
        
        .mensaje-usuario {
            background: #007bff !important;
            color: white !important;
            margin-left: auto !important;
            margin-right: 0 !important;
            max-width: 80% !important;
            text-align: right !important;
        }
        
        .mensaje-asistente {
            background: rgba(255,255,255,0.1) !important;
            color: white !important;
            margin-left: 0 !important;
            margin-right: auto !important;
            max-width: 90% !important;
            text-align: left !important;
        }
        
        #body-chat {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
        }
        
        .mensaje code {
            background: rgba(255,255,255,0.15) !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-family: 'Courier New', monospace !important;
            font-size: 0.9em !important;
        }
        
        .mensaje strong {
            font-weight: bold !important;
        }
        
        .mensaje em {
            font-style: italic !important;
        }
        </style>
    `;

    if (!document.getElementById('chat-personalization-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'chat-personalization-styles';
        styleElement.innerHTML = additionalStyles.replace(/<style>|<\/style>/g, '');
        document.head.appendChild(styleElement);
    }
});