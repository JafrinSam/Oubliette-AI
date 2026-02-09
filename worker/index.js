const { Worker } = require('bullmq');
const { processTrainingJob } = require('./controller');

// Load env vars
require('dotenv').config();

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
};

console.log("👷 Sentinel Worker: Initializing...");

const worker = new Worker('trainingQueue', async (job) => {
    // Pass the job to our Controller Logic
    return await processTrainingJob(job);
}, {
    connection: redisOptions,
    concurrency: 2 // Run up to 2 Docker containers at once
});

worker.on('ready', () => {
    console.log("✅ Worker is Online and Connected to Redis.");
});

worker.on('completed', job => {
    console.log(`🎉 Job ${job.id} finished successfully.`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed: ${err.message}`);
});