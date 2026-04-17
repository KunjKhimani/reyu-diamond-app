import { publisher } from "../config/redisPubSub.redis.js";

export const publishEvent = async (channel: string, data: any) => {
    try {
        await publisher.publish(channel, JSON.stringify(data));
        console.log(`Published to ${channel}`);
    } catch (error) {
        console.error("Publish error:", error);
    }
};
