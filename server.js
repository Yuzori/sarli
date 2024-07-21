const express = require('express');
const http = require('http');
const socket = io('https://sarlextracoiffure.onrender.com');
const path = require('path');
const schedule = require('node-schedule');

// Création de l'application Express
const app = express();
const server = http.createServer(app);

// Initialisation de Socket.IO avec CORS configuré
const io = require('socket.io')(http, {
    cors: {
      origin: "https://sarlextracoiffure.onrender.com",
      methods: ["GET", "POST"]
    }
  });

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Routes pour les pages web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const reservations = new Map(); // Stockage des réservations en mémoire

io.on('connection', (socket) => {
    console.log('Un client s\'est connecté');

    // Envoyer les réservations existantes au client lorsqu'il se connecte
    socket.emit('initialReservations', Array.from(reservations.values()));

    socket.on('newReservation', (reservation) => {
        console.log('Nouvelle réservation reçue:', reservation);

        const reservationTime = new Date(`2000-01-01T${reservation.time}`);
        const endTime = new Date(reservationTime.getTime() + 10 * 60000);

        let isTimeSlotAvailable = true;

        for (let [time, existingReservation] of reservations) {
            const existingEndTime = new Date(time.getTime() + 10 * 60000);
            if (
                (reservationTime >= time && reservationTime < existingEndTime) ||
                (endTime > time && endTime <= existingEndTime) ||
                (reservationTime <= time && endTime >= existingEndTime)
            ) {
                isTimeSlotAvailable = false;
                break;
            }
        }

        if (isTimeSlotAvailable) {
            reservation.id = Date.now().toString();
            reservations.set(reservationTime, reservation);
            io.emit('newReservation', reservation);
            console.log('Réservation acceptée, envoi de la réponse');
            socket.emit('reservationResponse', {
                success: true
            });
        } else {
            console.log('Réservation refusée, envoi de la réponse');
            socket.emit('reservationResponse', {
                success: false,
                message: "Une réservation pour cette heure est déjà en cours. Veuillez choisir un autre horaire."
            });
        }
    });

    socket.on('deleteReservation', (id) => {
        for (let [time, reservation] of reservations) {
            if (reservation.id === id) {
                reservations.delete(time);
                io.emit('reservationDeleted', id);
                break;
            }
        }
    });

    socket.on('deleteAllReservations', () => {
        reservations.clear();
        io.emit('allReservationsDeleted');
    });
});

// Planifier la suppression des réservations tous les jours à 17h
schedule.scheduleJob('0 17 * * *', () => {
    reservations.clear();
    io.emit('allReservationsDeleted');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
