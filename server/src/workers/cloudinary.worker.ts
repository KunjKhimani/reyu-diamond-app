import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processCloudinaryJob, type CloudinaryJobData } from "../jobs/cloudinary.job.js";
import { deadCloudinaryQueue } from "../queues/cloudinary.queue.js";
import { logService } from "../services/log.service.js";

/**
 * Worker: Listens for jobs on 'cloudinary_queue' and processes them.
 */
export const startCloudinaryWorker = () => {
  const worker = new Worker<CloudinaryJobData>(
    "cloudinary_queue",
    async (job: Job) => {
      console.log(`[CloudinaryWorker] Processing job ${job.id}`);
      await processCloudinaryJob(job.data);

      // Log completion
      await logService.createSystemLog({
        eventType: "JOB_COMPLETED",
        severity: "INFO",
        message: `Cloudinary media processing completed for job ${job.id}`,
        targetId: job.id as any,
        meta: { jobId: job.id, inventoryId: job.data.inventoryId }
      });
    },
    {
      connection: redisConnection,
      concurrency: 5, // Cloudinary operations are somewhat slow, keep concurrency low
      lockDuration: 120000,   // Wait longer for a stalled job (Cloudinary takes time)
      stalledInterval: 60000,  // Check for stalled jobs every 60s
      limiter: {
        max: 10,       // Max 10 requests
        duration: 5000 // Per 5 seconds (be conservative with media uploads)
      }
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

    // Log failure
    await logService.createSystemLog({
      eventType: "JOB_FAILED",
      severity: attempts >= maxAttempts ? "CRITICAL" : "ERROR",
      message: `Cloudinary media job ${job.id} failed: ${err.message}`,
      targetId: job.id as any,
      meta: { jobId: job.id, inventoryId: job.data.inventoryId, attempt: attempts, maxAttempts, stack: err.stack }
    });

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

      await logService.createSystemLog({
        eventType: "JOB_MOVED_TO_DLQ",
        severity: "CRITICAL",
        message: `Cloudinary job ${job.id} moved to DLQ`,
        targetId: job.id as any,
        meta: { jobId: job.id, inventoryId: job.data.inventoryId }
      });
    }
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
