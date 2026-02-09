const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const datasetRoutes = require('./routes/datasetRoutes');
const jobRoutes = require('./routes/jobRoutes');
const scriptRoutes = require('./routes/scriptRoutes');
const runtimeRoutes = require('./routes/runtimeRoutes');
const { redisSubscriber } = require('./redis');

// --- APP SETUP ---
const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api', apiRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/runtimes', runtimeRoutes);

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('join-room', (jobId) => {
        socket.join(jobId);
    });
});

// --- MICROSERVICE BRIDGE (REDIS -> SOCKET) ---
redisSubscriber.subscribe('job-logs', (err) => {
    if (err) console.error("Redis Subscribe Error:", err);
});

redisSubscriber.on('message', (channel, message) => {
    if (channel === 'job-logs') {
        const { jobId, text } = JSON.parse(message);
        io.to(jobId).emit('log', text);
    }
});

// --- START ---
server.listen(config.PORT, () => {
    console.log(`🌐 Sentinel Server running on http://localhost:${config.PORT}`);
});