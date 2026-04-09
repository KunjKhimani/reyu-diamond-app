import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { CloudinaryJobData } from "../jobs/cloudinary.job.js";

export const cloudinaryQueue = new Queue("cloudinary_queue", DEFAULT_QUEUE_CONFIG);
export const deadCloudinaryQueue = new Queue("dead_cloudinary_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Adds a Cloudinary job to the queue.
 * @param data Job data
 * @param delay Optional delay in milliseconds
 */
export const addClodinaryJob = async (data: CloudinaryJobData, delay?: number) => {
  try {
    const job = await cloudinaryQueue.add("cloudinary_process", data, {
      delay: delay || 0,
    });
    
    if (delay) {
      console.log(`[CloudinaryQueue] Job enqueued: ${job.id} with ${delay}ms delay`);
    } else {
      console.log(`[CloudinaryQueue] Job enqueued: ${job.id}`);
    }
    
    return job;
  } catch (error) {
    console.error("[CloudinaryQueue] Error enqueuing job:", error);
    throw error;
  }
};