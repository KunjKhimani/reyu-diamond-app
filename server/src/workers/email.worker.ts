import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processEmailJob, type EmailJobData } from "../jobs/email.job.js";
import { deadEmailQueue } from "../queues/email.queue.js";
import { logService } from "../services/log.service.js";

/**
 * Worker: Listens for jobs on 'email_queue' and processes them.
 */
export const startEmailWorker = () => {
  const worker = new Worker<EmailJobData>(
    "email_queue",
    async (job: Job) => {
      console.log(`[EmailWorker] Processing job ${job.id} for ${job.data.to} (Attempt ${job.attemptsMade + 1})`);
      await processEmailJob(job.data, job.attemptsMade);
      
      // Log completion
      await logService.createSystemLog({
        eventType: "JOB_COMPLETED",
        severity: "INFO",
        message: `Email sent successfully to ${job.data.to}`,
        targetId: job.id as any,
        meta: { jobId: job.id, to: job.data.to, attempt: job.attemptsMade + 1 }
      });
    },
    {
      connection: redisConnection,
      concurrency: 5,
      lockDuration: 60000,   // Wait longer for a stalled job
      stalledInterval: 30000, // Check for stalled jobs every 30s
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

    // Log failure
    await logService.createSystemLog({
      eventType: "JOB_FAILED",
      severity: attempts >= maxAttempts ? "CRITICAL" : "ERROR",
      message: `Email job ${job.id} failed: ${err.message}`,
      targetId: job.id as any,
      meta: { jobId: job.id, to: job.data.to, attempt: attempts, maxAttempts, stack: err.stack }
    });

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

      await logService.createSystemLog({
        eventType: "JOB_MOVED_TO_DLQ",
        severity: "CRITICAL",
        message: `Email job ${job.id} moved to DLQ`,
        targetId: job.id as any,
        meta: { jobId: job.id, to: job.data.to }
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