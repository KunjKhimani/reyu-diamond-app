import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";

/**
 * Scheduled Queue: For recurring, time-based tasks like daily cleanups, 
 * automated reports, or periodic heartbeat checks.
 */
export const scheduledQueue = new Queue("scheduled_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Adds or updates a repeatable job in the queue.
 * @param name Unique name for the job (e.g., 'daily_cleanup')
 * @param data Data for the job
 * @param cron Cron expression (e.g., '0 0 * * *' for midnight)
 */
export const addRepeatableJob = async (name: string, data: any, cron: string) => {
  try {
    const job = await scheduledQueue.add(name, data, {
      repeat: {
        pattern: cron,
      },
      removeOnComplete: {
        count: 50, // Keep last 50 completed instances of this repeatable job
        age: 24 * 3600,
      },
      removeOnFail: {
        count: 100,
      }
    });
    console.log(`[ScheduledQueue] Registered repeatable job: ${name} with pattern: ${cron}`);
    return job;
  } catch (error) {
    console.error(`[ScheduledQueue] Error registering job ${name}:`, error);
    throw error;
  }
};
