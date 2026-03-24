const prisma = require('../prisma');
const { initMinio } = require('../config/minio');
const Redis = require('ioredis');

/**
 * Verified Service Health before starting the main worker.
 * Retries if services are unavailable (DB, Redis, MinIO).
 */
async function waitForServices(redisConfig, maxRetries = 30, interval = 2000) {
    let retries = 0;
    const redis = new Redis(redisConfig);

    console.log("[Health] 🏗️ Worker Pre-flight Service Checks...");

    while (retries < maxRetries) {
        try {
            // 1. Database Check
            await prisma.$connect();
            console.log("✅ Database: Connected");

            // 2. Redis Check
            await redis.ping();
            console.log("✅ Redis: Connected");

            // 3. MinIO Check
            await initMinio();
            console.log("✅ MinIO: Connected & Bucket Verified");

            console.log("[Health] 👷 Services are online. Starting worker...");
            await redis.quit();
            return true;
        } catch (error) {
            retries++;
            console.error(`[Health] ❌ Worker Check Failed (Attempt ${retries}/${maxRetries}): ${error.message}`);
            
            if (retries >= maxRetries) {
                console.error("[Health] 💀 Fatal: Max retries reached. Physical services are missing.");
                await redis.quit();
                throw new Error("Service dependency failure.");
            }

            console.log(`[Health] ⏳ Retrying in ${interval / 1000}s...`);
            await new Promise(res => setTimeout(res, interval));
        }
    }
}

module.exports = { waitForServices };
