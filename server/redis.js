const { Queue } = require('bullmq');
const Redis = require('ioredis');
const config = require('./config');

// Connection options
const redisConfig = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
};

// 1. The Subscriber (For Logs from Worker)
const redisSubscriber = new Redis(redisConfig);

// 2. The Job Queue (For Dispatching Tasks)
const trainingQueue = new Queue('trainingQueue', {
    connection: redisConfig
});

module.exports = {
    redisSubscriber,
    trainingQueue
};