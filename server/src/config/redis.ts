import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isRedisEnabled = process.env.REDIS_ENABLED === "true";

let redis: Redis | null = null;

if (isRedisEnabled) {
    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redis.on("connect", () => {
            console.log("Redis connected successfully");
        });

        redis.on("error", (err: Error) => {
            console.error("Redis connection error:", err.message);
        });
    } catch (error) {
        console.error("Failed to initialize Redis:", error);
    }
} else {
    console.log("Redis is disabled via environment variables");
}

export default redis;
