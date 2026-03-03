// config/minio.js
const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'oubliette-datasets';

// Ensure Bucket Exists on Startup
(async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`[MinIO] Created new bucket: ${BUCKET_NAME}`);
        } else {
            console.log(`[MinIO] Connected to existing bucket: ${BUCKET_NAME}`);
        }
    } catch (err) {
        console.error('[MinIO] Connection Error. Is MinIO running?', err);
    }
})();

module.exports = { minioClient, BUCKET_NAME };
