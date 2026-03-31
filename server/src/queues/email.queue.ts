import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { EmailJobData } from "../jobs/email.job.js";

export const emailQueue = new Queue("email_queue", DEFAULT_QUEUE_CONFIG);
export const deadEmailQueue = new Queue("dead_email_queue", DEFAULT_QUEUE_CONFIG);

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
