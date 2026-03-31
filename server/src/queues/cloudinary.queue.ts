import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import type { CloudinaryJobData } from "../jobs/cloudinary.job.js";

const DEFAULT_QUEUE_CONFIG = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const cloudinaryQueue = new Queue("cloudinary_queue", DEFAULT_QUEUE_CONFIG);

export const addClodinaryJob = async (data: CloudinaryJobData) => {
  try {
    const job = await cloudinaryQueue.add("cloudinary_process", data);
    console.log(`[CloudinaryQueue] Job enqueued: ${job.id}`);
    return job;
  } catch (error) {
    console.error("[CloudinaryQueue] Error enqueuing job:", error);
    throw error;
  }
};