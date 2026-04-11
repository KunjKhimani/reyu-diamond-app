import { redisConnection } from "./redis.config.js";

export const DEFAULT_QUEUE_CONFIG = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential" as const,
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Or keep for 24 hours
    },
    removeOnFail: {
      count: 100, // Keep last 100 failed jobs for manual review
      age: 7 * 24 * 3600, // Keep for 7 days
    },
  },
};
