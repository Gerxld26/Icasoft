$(document).ready(function() {
    const $textInput = $('#textIAID');
    const $sendButton = $('.btnChat');
    const $bodyChat = $('#body-chat');
    const $asistenteSoporte = $('#asistenteSoporte');

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

    $textInput.on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    $sendButton.on('click', sendMessage);

    $textInput.on('input', function() {
        const mensaje = $(this).val().trim();
        
        if (mensaje === "") {
            $asistenteSoporte.removeClass('modo-chat-activo');
        } else {
            $asistenteSoporte.addClass('modo-chat-activo');
        }
    });
});