import { redis } from "../config/redis.config.js";

async function inspectRedis() {
  try {
    console.log("🔍 Connecting to Redis...");
    const keys = await redis.keys("*");
    console.log(`Found ${keys.length} keys:`, keys);

    for (const key of keys) {
      const type = await redis.type(key);
      console.log(`\n--- Key: ${key} [Type: ${type}] ---`);
      
      if (type === "list") {
        const data = await redis.lrange(key, 0, -1);
        console.log("Data (List):", data.map(d => {
            try { return JSON.parse(d); } catch { return d; }
        }));
      } else if (type === "string") {
        const data = await redis.get(key);
        console.log("Data (String):", data);
      } else {
        console.log(`(Inspection not implemented for type ${type} in this script)`);
      }
    }

    console.log("\n✅ Done.");
  } catch (error) {
    console.error("❌ Error inspecting Redis:", error);
  } finally {
    redis.disconnect();
  }
}

inspectRedis();
