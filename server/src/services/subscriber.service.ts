import { subscriber } from "../config/redisPubSub.redis.js";
import redis from "../config/redis.js";

/**
 * Reusable helper to clear all paginated inventory list caches
 */
const clearInventoryListCaches = async () => {
    if (!redis) return;
    
    console.log("Invalidating all inventory list caches...");
    let cursor = "0";
    const prefix = "cache:inventory_list:*";
    
    do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", prefix, "COUNT", 100);
        cursor = newCursor;
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } while (cursor !== "0");
    
    console.log("Cleared all inventory list caches.");
};

export const initSubscriber = async () => {
    // 1. Subscribe to channels
    await subscriber.subscribe("inventory-cache-updates");
    await subscriber.subscribe("inventory-updates");

    console.log("Subscribed to inventory channels: [inventory-cache-updates, inventory-updates]");

    // 2. Single Message Handler for all channels
    subscriber.on("message", async (channel, message) => {
        console.log(`[PubSub] Received from ${channel}:`, message);
        
        try {
            const data = JSON.parse(message);

            switch (channel) {
                // Channel for structural cache invalidation (lists, pagination)
                case "inventory-cache-updates":
                    if (data.type === "INVALIDATE_INVENTORY_CACHE") {
                        await clearInventoryListCaches();
                    }
                    break;

                // Channel for lifecycle events (added, updated, deleted)
                case "inventory-updates":
                    // If an item is added or updated, we might want to clear its specific cache
                    if (data.key) {
                        await redis?.del(`cache:${data.key}`);
                        console.log(`Cache cleared for specific item: ${data.key}`);
                    }

                    // For updates/deletes/additions, we ALSO refresh the lists 
                    // (User's service does this by publishing to the other channel, 
                    // but we can add safety logic here if needed)
                    if (data.type === "INVENTORY_UPDATED" || data.type === "INVENTORY_DELETED" || data.type === "INVENTORY_ADDED") {
                        console.log(`Inventory lifecycle event: ${data.type}`);
                    }
                    break;

                default:
                    console.warn(`No handler for channel: ${channel}`);
            }
        } catch (error) {
            console.error(`Error processing message from ${channel}:`, error);
        }
    });
};
