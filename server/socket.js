const { Server } = require('socket.io');
const Redis = require('ioredis');
const config = require('./config');

const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

exports.setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // Subscribe to all log channels
    redisSub.psubscribe('logs:*', (err, count) => {
        if (err) console.error("Redis Sub Error:", err);
    });

    redisSub.on('pmessage', (pattern, channel, message) => {
        // channel = "logs:job-123"
        const jobId = channel.split(':')[1];

        // Forward to the specific room for that job
        io.to(jobId).emit('log', message);
    });

    io.on('connection', (socket) => {
        // Frontend sends: socket.emit('join-job', 'job-123')
        // We also keep 'join-room' for backward compatibility if needed, 
        // but the user specified 'join-job' in the snippet.
        // Let's support both or just switching to the new one?
        // The user snippet says: socket.on('join-job', ...) 
        // My previous code in index.js used 'join-room'. 
        // I will support both to be safe, but focus on the new one.

        socket.on('join-job', (jobId) => {
            socket.join(jobId);
        });

        socket.on('join-room', (jobId) => { // Backward compatibility
            socket.join(jobId);
        });

        socket.on('leave-job', (jobId) => {
            socket.leave(jobId);
        });
    });

    console.log("🔌 Socket.io Service Initialized");
    return io;
};
