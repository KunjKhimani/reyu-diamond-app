import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { EmailJobData } from "../jobs/email.job.js";

export const emailQueue = new Queue("email_queue", DEFAULT_QUEUE_CONFIG);
export const deadEmailQueue = new Queue("dead_email_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Producer: Standard function to add an email job to the queue.
 * @param data Email to send
 * @param delay Optional delay in milliseconds (e.g., 600000 for 10 minutes)
 */
export const addEmailJob = async (data: EmailJobData, delay?: number) => {
  try {
    const job = await emailQueue.add("send_email", data, {
      delay: delay || 0,
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // Or keep for 24 hours
      },
      removeOnFail: {
        count: 500, // Keep failed jobs for manual review
      }
    });
    
    if (delay) {
      console.log(`[EmailQueue] Job enqueued: ${job.id} for ${data.to} with ${delay}ms delay`);
    } else {
      console.log(`[EmailQueue] Job enqueued: ${job.id} for ${data.to}`);
    }
    
    return job;
  } catch (error) {
    console.error("[EmailQueue] Error enqueuing job:", error);
    throw error;
  }
};
