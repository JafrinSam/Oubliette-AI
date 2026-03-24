const prisma = require('../config/prisma');
const { redisSubscriber } = require('../redis');
const { initMinio } = require('../config/minio');

/**
 * Verified Service Health before starting the main application.
 * Retries if services are unavailable (DB, Redis, MinIO).
 */
async function waitForServices(maxRetries = 30, interval = 2000) {
    let retries = 0;

    console.log("[Health] 🏥 Starting Pre-flight Service Checks...");

    while (retries < maxRetries) {
        try {
            // 1. Database Check
            await prisma.$connect();
            console.log("✅ Database: Connected");

            // 2. Redis Check
            await redisSubscriber.ping();
            console.log("✅ Redis: Connected");

            // 3. MinIO Check
            await initMinio();
            console.log("✅ MinIO: Connected & Bucket Verified");

            console.log("[Health] 🚀 All services are online. Starting application...");
            return true;
        } catch (error) {
            retries++;
            console.error(`[Health] ❌ Check Failed (Attempt ${retries}/${maxRetries}): ${error.message}`);
            
            if (retries >= maxRetries) {
                console.error("[Health] 💀 Fatal: Max retries reached. Physical services are missing.");
                throw new Error("Service dependency failure.");
            }

            console.log(`[Health] ⏳ Retrying in ${interval / 1000}s...`);
            await new Promise(res => setTimeout(res, interval));
        }
    }
}

module.exports = { waitForServices };
