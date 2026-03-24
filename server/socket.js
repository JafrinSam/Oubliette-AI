const { Server } = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const config = require('./config');
const prisma = require('./prisma');
const { JWT_SECRET } = require('./middleware/authMiddleware');

const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

exports.setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        // ✅ FIX (H3): Restrict to known client origin
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ["GET", "POST"]
        }
    });

    // ✅ FIX (C5): JWT authentication middleware — runs before any event handler
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Unauthorized: No token provided.'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.data.user = decoded; // { id, email, role }
            next();
        } catch (err) {
            return next(new Error('Unauthorized: Invalid or expired token.'));
        }
    });

    // Subscribe to all log and status channels
    redisSub.psubscribe('logs:*', 'status:*', (err, count) => {
        if (err) console.error("Redis Sub Error:", err);
    });

    redisSub.on('pmessage', (pattern, channel, message) => {
        const [type, jobId] = channel.split(':');
        if (type === 'logs') {
            io.to(jobId).emit('log', message);
        } else if (type === 'status') {
            io.to(jobId).emit('status-update', message);
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user;
        console.log(`[Socket] Authenticated connection: ${user.email} (${user.role})`);

        // ✅ FIX (C5): Authorise room join — only the owner, admins, and auditors may subscribe to a job's logs
        socket.on('join-job', async (jobId) => {
            try {
                const job = await prisma.job.findUnique({ where: { id: jobId } });
                if (!job) {
                    socket.emit('error', 'Job not found.');
                    return;
                }
                if (
                    job.ownerId !== user.id &&
                    user.role !== 'ML_ADMIN' &&
                    user.role !== 'SECURITY_AUDITOR'
                ) {
                    socket.emit('error', 'Access Denied: You do not own this job.');
                    return;
                }
                socket.join(jobId);
            } catch (err) {
                console.error('[Socket] join-job error:', err);
                socket.emit('error', 'Internal error while joining job room.');
            }
        });

        socket.on('join-room', async (jobId) => { // Backward compatibility
            socket.emit('warning', 'join-room is deprecated; please use join-job.');
            socket.emit('join-job', jobId); // re-trigger the authorised handler
        });

        socket.on('leave-job', (jobId) => {
            socket.leave(jobId);
        });
    });

    console.log("🔌 Socket.io Service Initialized");
    return io;
};
