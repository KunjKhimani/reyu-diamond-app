import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processCloudinaryJob, type CloudinaryJobData } from "../jobs/cloudinary.job.js";

/**
 * Worker: Listens for jobs on 'cloudinary_queue' and processes them.
 */
export const startCloudinaryWorker = () => {
  const worker = new Worker<CloudinaryJobData>(
    "cloudinary_queue",
    async (job: Job) => {
      console.log(`[CloudinaryWorker] Processing job ${job.id}`);
      await processCloudinaryJob(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 2, // Cloudinary operations are somewhat slow, keep concurrency low
    }
  );

  worker.on("completed", (job) => {
    console.log(`[CloudinaryWorker] Job ${job.id} completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[CloudinaryWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Cloudinary Worker is ready!");
  return worker;
};
