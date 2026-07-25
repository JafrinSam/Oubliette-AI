require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    STORAGE_PATHS: {
        DATASETS: '../storage/datasets',
        SCRIPTS: '../storage/scripts',
        MODELS: '../storage/models',
        UPLOADS: '../storage/temp'
    }
};