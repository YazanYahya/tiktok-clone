import {Redis} from '@upstash/redis';

const redis = new Redis({
    url: process.env.REDIS_HOST,
    token: process.env.REDIS_PASSWORD,
});

export async function getByKey(key) {
    try {
        return await redis.get(key);
    } catch (error) {
        console.error(`Error fetching from Redis key: ${key}`, error);
        throw new Error("Failed to fetch items from Redis.");
    }
}