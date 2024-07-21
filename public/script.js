const socket = io('https://sarlextracoiffure.onrender.com');
const io = require('socket.io')(http);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservationForm');
    const messageDiv = document.getElementById('message');
    const submitButton = form.querySelector('button[type="submit"]');
    
    gsap.from('input, button', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const time = document.getElementById('time').value;
        const [hours, minutes] = time.split(':').map(Number);

        if (hours < 9 || hours >= 21 || (hours === 21 && minutes > 0)) {
            showMessage("Sélectionnez une heure entre 9h et 21h", 'red');
            return;
        }

        const reservation = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            haircut: document.getElementById('haircut').value,
            type: document.getElementById('type').value,
            time: time
        };

        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        socket.emit('newReservation', reservation);
    });

    socket.on('reservationResponse', (response) => {
        submitButton.disabled = false;
        submitButton.textContent = 'Réserver';

        if (response.success) {
            showMessage("Félicitations, votre réservation a été transmise. Rendez-vous chez nous !", 'green');
            animateSuccess();
            form.reset();
        } else {
            showMessage(response.message, 'red');
        }
    });

    function showMessage(text, color) {
        messageDiv.textContent = text;
        messageDiv.style.color = color;
        gsap.from(messageDiv, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
    }
        });
    