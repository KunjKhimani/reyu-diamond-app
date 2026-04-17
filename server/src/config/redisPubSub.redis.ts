import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const publisher = new Redis(redisUrl);

export const subscriber = new Redis(redisUrl);

// Connection logs (optional)
publisher.on("connect", () => {
    console.log("Publisher connected");
});

publisher.on("error", (err) => {
    console.error("Publisher error: ", err);
})

subscriber.on("connect", () => {
    console.log("Subscriber connected");
});

subscriber.on("error", (err) => {
    console.error("Subscriber error:", err.message);
});
