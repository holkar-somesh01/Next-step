const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/user.route');
const chatRoutes = require('./routes/chat.route');
const schemeRoutes = require('./routes/scheme.route');
const contactRoutes = require('./routes/contact.route');
const examRoutes = require('./routes/exam.route');
const secretContactRoutes = require('./routes/secretContact.route');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/secret-contacts', secretContactRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Next Step API is running...');
});

const { activeUsers } = require('./utils/notification');

const socketToUser = new Map();

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User ${socket.id} joined room: ${data}`);

        // Register active user when they join their personal user room (data length 24)
        if (typeof data === 'string' && /^[0-9a-fA-F]{24}$/.test(data)) {
            socketToUser.set(socket.id, data);
            activeUsers.add(data);
            console.log(`User ${data} is now active (socket: ${socket.id})`);
        }
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('receive_message', data);
        if (data.receiver) {
            socket.to(data.receiver).emit('new_message_notification', data);
        }
    });

    socket.on('edit_message', (data) => {
        socket.to(data.room).emit('message_edited', data);
    });

    socket.on('delete_message', (data) => {
        socket.to(data.room).emit('message_deleted', data);
    });

    socket.on('typing', (data) => {
        socket.to(data.room).emit('typing', data);
    });

    socket.on('stop_typing', (data) => {
        socket.to(data.room).emit('stop_typing', data);
    });

    socket.on('policy_change', (data) => {
        socket.to(data.room).emit('policy_change', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const userId = socketToUser.get(socket.id);
        if (userId) {
            socketToUser.delete(socket.id);
            // Check if there are other sockets for this user still connected
            const sockets = io.sockets.adapter.rooms.get(userId);
            if (!sockets || sockets.size === 0) {
                activeUsers.delete(userId);
                console.log(`User ${userId} is now offline/inactive`);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
app.get('/health', (req, res) => {
    res.send('Next Step Server is Healthy...');
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;

