import { redisConnection } from "./redis.config.js";

export const DEFAULT_QUEUE_CONFIG = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential" as const,
      delay: 5000,
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false, // Keep failed jobs for manual review if needed
  },
};
