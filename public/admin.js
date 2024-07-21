const socket = io('https://sarlextracoiffure.onrender.com');

document.addEventListener('DOMContentLoaded', () => {
    const reservationList = document.getElementById('reservationList');
    const modal = document.getElementById('confirmationModal');
    const confirmAction = document.getElementById('confirmAction');
    const cancelAction = document.getElementById('cancelAction');
    const notificationSound = document.getElementById('notificationSound');
    let currentReservationId;

    // Précharger le son en réponse à une interaction utilisateur initiale
    document.body.addEventListener('click', () => {
        notificationSound.play().catch(error => console.log('Erreur lors de la lecture du son:', error));
    }, { once: true }); // L'événement se déclenche une seule fois

    // Récupérer les réservations existantes au chargement
    socket.on('initialReservations', (reservations) => {
        reservations.forEach(reservation => {
            const li = document.createElement('li');
            li.dataset.id = reservation.id;
            li.innerHTML = `
                <strong>${reservation.name}</strong> |
                Téléphone - ${reservation.phone} |
                Coiffure - ${reservation.haircut} |
                Type - ${reservation.type} |
                Heure - ${reservation.time}
                <button class="delete-btn" data-id="${reservation.id}">Supprimer</button>
            `;
            reservationList.appendChild(li);
        });
    });

    socket.on('newReservation', (reservation) => {
        const li = document.createElement('li');
        li.dataset.id = reservation.id;
        li.innerHTML = `
            <strong>${reservation.name}</strong> |
            Téléphone - ${reservation.phone} |
            Coiffure - ${reservation.haircut} |
            Type - ${reservation.type} |
            Heure - ${reservation.time}
            <button class="delete-btn" data-id="${reservation.id}">Supprimer</button>
        `;
        reservationList.prepend(li);

        // Lecture automatique du son lors de la réception de nouvelles réservations
        notificationSound.play().catch(error => console.log('Erreur lors de la lecture du son:', error));

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nouvelle réservation", {
                body: `${reservation.name} a réservé pour ${reservation.time}`
            });
        }
    });

    socket.on('reservationDeleted', (id) => {
        const li = document.querySelector(`[data-id="${id}"]`);
        if (li) li.remove();
    });

    socket.on('allReservationsDeleted', () => {
        reservationList.innerHTML = ''; // Effacer toutes les réservations de la liste
    });

    reservationList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            currentReservationId = e.target.dataset.id;
            showConfirmationModal('Êtes-vous sûr de vouloir supprimer cette réservation ?', 'deleteReservation');
        }
    });

    confirmAction.addEventListener('click', () => {
        if (confirmAction.dataset.action === 'deleteReservation') {
            socket.emit('deleteReservation', currentReservationId);
        }
        hideConfirmationModal();
    });

    cancelAction.addEventListener('click', hideConfirmationModal);

    function showConfirmationModal(message, action) {
        document.getElementById('confirmationMessage').textContent = message;
        modal.classList.add('active');
        confirmAction.dataset.action = action;
    }

    function hideConfirmationModal() {
        modal.classList.remove('active');
    }
});
