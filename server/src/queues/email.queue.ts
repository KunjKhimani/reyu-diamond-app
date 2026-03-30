import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import type { EmailJobData } from "../jobs/email.job.js";

const DEFAULT_QUEUE_CONFIG = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false, // Keep failed jobs for manual review if needed
  },
};

export const emailQueue = new Queue("email_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Producer: Standard function to add an email job to the queue.
 */
export const addEmailJob = async (data: EmailJobData) => {
  try {
    const job = await emailQueue.add("send_email", data);
    console.log(`[EmailQueue] Job enqueued: ${job.id} for ${data.to}`);
    return job;
  } catch (error) {
    console.error("[EmailQueue] Error enqueuing job:", error);
    throw error;
  }
};
