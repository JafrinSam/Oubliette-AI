const express = require('express');
const http = require('http');
const { setupSocket } = require('./socket');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const datasetRoutes = require('./routes/datasetRoutes');
const jobRoutes = require('./routes/jobRoutes');
const scriptRoutes = require('./routes/scriptRoutes');
const runtimeRoutes = require('./routes/runtimeRoutes');
const modelRoutes = require('./routes/modelRoutes');
const { redisSubscriber } = require('./redis');

// --- APP SETUP ---
const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// 📝 REQUEST LOGGER
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
        console.log(`[API] Body:`, JSON.stringify(req.body, null, 2).substring(0, 500)); // Truncate large bodies
    }
    next();
});

// --- ROUTES ---
app.use('/api', apiRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/runtimes', runtimeRoutes);
app.use('/api/models', modelRoutes);

// --- SOCKET.IO SETUP ---
setupSocket(server);

// --- START ---
server.listen(config.PORT, () => {
    console.log(`🌐 Sentinel Server running on http://localhost:${config.PORT}`);
});