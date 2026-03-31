import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processCloudinaryJob, type CloudinaryJobData } from "../jobs/cloudinary.job.js";
import { deadCloudinaryQueue } from "../queues/cloudinary.queue.js";

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
      concurrency: 5, // Cloudinary operations are somewhat slow, keep concurrency low
    }
  );

  worker.on("completed", (job) => {
    console.log(`[CloudinaryWorker] Job ${job.id} completed!`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const attempts = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 5;

    console.error(`[CloudinaryWorker] ❌ Job ${job.id} failed (Attempt ${attempts}/${maxAttempts}): ${err.message}`);

    // If max retries reached, move to Dead Letter Queue (DLQ)
    if (attempts >= maxAttempts) {
      console.log(`[CloudinaryWorker] ☠️ Moving job ${job.id} to Dead Letter Queue (DLQ) after ${attempts} failures.`);
      
      await deadCloudinaryQueue.add("dead_cloudinary", {
        originalJobId: job.id,
        data: job.data,
        failedReason: err.message,
        stackTrace: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
    console.error(`[CloudinaryWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Cloudinary Worker is ready!");
  return worker;
};

/**
 * ☠️ Dead Cloudinary Worker: Monitors the Dead Letter Queue for manual review or alerting.
 */
export const startDeadCloudinaryWorker = () => {
  const worker = new Worker(
    "dead_cloudinary_queue",
    async (job: Job) => {
      console.warn(`[DeadCloudinaryWorker] ⚠️ Dead job detected: ${job.id}`);
      console.warn(`[DeadCloudinaryWorker] Original Info:`, JSON.stringify(job.data, null, 2));
      
      // Here you could send an alert to Sentry, Email an Admin, or log to a specific DB table
    },
    { 
      connection: redisConnection,
      concurrency: 5 
    }
  );

  console.log("💀 Dead Cloudinary Monitoring is ready!");
  return worker;
};
