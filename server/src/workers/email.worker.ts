 import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processEmailJob, type EmailJobData } from "../jobs/email.job.js";
import { deadEmailQueue } from "../queues/email.queue.js";

/**
 * Worker: Listens for jobs on 'email_queue' and processes them.
 */
export const startEmailWorker = () => {
  const worker = new Worker<EmailJobData>(
    "email_queue",
    async (job: Job) => {
      console.log(`[EmailWorker] Processing job ${job.id} for ${job.data.to} (Attempt ${job.attemptsMade + 1})`);
      await processEmailJob(job.data, job.attemptsMade);
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: {
        max: 5,        // Max 5 emails
        duration: 2000 // Per 2 seconds
      }
    }
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] ✅ Job ${job.id} completed!`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const attempts = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 5;

    console.error(`[EmailWorker] ❌ Job ${job.id} failed (Attempt ${attempts}/${maxAttempts}): ${err.message}`);

    // If max retries reached, move to Dead Letter Queue (DLQ)
    if (attempts >= maxAttempts) {
      console.log(`[EmailWorker] ☠️ Moving job ${job.id} to Dead Letter Queue (DLQ) after ${attempts} failures.`);
      
      await deadEmailQueue.add("dead_email", {
        originalJobId: job.id,
        data: job.data,
        failedReason: err.message,
        stackTrace: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
  });

  console.log("🚀 Email Worker is ready!");
  return worker;
};

/**
 * ☠️ Dead Email Worker: Monitors the Dead Letter Queue for manual review or alerting.
 */
export const startDeadEmailWorker = () => {
  const worker = new Worker(
    "dead_email_queue",
    async (job: Job) => {
      console.warn(`[DeadEmailWorker] ⚠️ Dead job detected: ${job.id}`);
      console.warn(`[DeadEmailWorker] Original Info:`, JSON.stringify(job.data, null, 2));
      
      // Here you could send an alert to Sentry, Email an Admin, or log to a specific DB table
    },
    { 
      connection: redisConnection,
      concurrency: 5
    }
  );

  console.log("💀 Dead Email Monitoring is ready!");
  return worker;
};