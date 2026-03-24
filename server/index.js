require('dotenv').config();
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
const authRoutes = require('./routes/authRoutes');
const { redisSubscriber } = require('./redis');

// ✅ FIX (L4): Global uncaught exception / rejection handlers — prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('💀 UNCAUGHT EXCEPTION — shutting down gracefully:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💀 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    process.exit(1);
});

// --- APP SETUP ---
const app = express();
const server = http.createServer(app);

// --- MIDDLEWARE ---
// ✅ FIX (H3): Restrict CORS to the configured client origin
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// ✅ FIX (H2): Sanitized request logger — redact sensitive fields
const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'key', 'authorization', 'passwd']);

function sanitizeBody(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [k, v] of Object.entries(obj)) {
        sanitized[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '***' : v;
    }
    return sanitized;
}

app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        const safe = sanitizeBody(req.body);
        console.log(`[API] Body:`, JSON.stringify(safe, null, 2).substring(0, 500));
    }
    next();
});

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/runtimes', runtimeRoutes);
app.use('/api/models', modelRoutes);

// ✅ FIX (L4): Express global error-handling middleware
app.use((err, req, res, next) => {
    console.error('[Express] Unhandled error:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// --- SOCKET.IO SETUP ---
setupSocket(server);

// --- START ---
const { waitForServices } = require('./utils/serviceHealth');

(async () => {
    try {
        await waitForServices();
        server.listen(config.PORT, () => {
            console.log(`🌐 Sentinel Server running on http://localhost:${config.PORT}`);
        });
    } catch (err) {
        console.error("💀 FATAL: Could not start server due to service failures:", err.message);
        process.exit(1);
    }
})();