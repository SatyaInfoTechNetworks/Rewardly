const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null // Required by BullMQ
};

if (process.env.REDIS_PASS) {
  redisConfig.password = process.env.REDIS_PASS;
}
if (process.env.REDIS_USER && process.env.REDIS_USER !== 'default') {
  redisConfig.username = process.env.REDIS_USER;
}

console.log(`📡 Connecting to Redis at ${redisConfig.host}:${redisConfig.port}...`);

const redisConnection = new Redis(redisConfig);

redisConnection.on('connect', () => {
  console.log('✅ Redis connected successfully.');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});

module.exports = redisConnection;
