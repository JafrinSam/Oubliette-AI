const { Worker } = require('bullmq');
const { processTrainingJob } = require('./controller');

// Config for Redis URL - Assuming localhost for simple setup or env var
const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

console.log("👷 Oubliette Secure Worker: Online");

// Initialize Worker
// Make sure 'training-queue' matches the producer in jobController.js
const worker = new Worker('training-queue', async (job) => {
    return await processTrainingJob(job);
}, {
    connection: REDIS_CONNECTION,
    concurrency: 1, // 1 GPU = 1 Concurrent Job (Adjust as needed)
    lockDuration: 60000 // Lock job processing to prevent timeouts
});

// Worker Lifecycle Events
worker.on('ready', () => {
    console.log("✅ Worker connected to Redis.");
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed in queue: ${err.message}`);
});

worker.on('error', (err) => {
    console.error("❌ Worker Redis Error:", err);
});