import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processNotificationJob, type NotificationJobData } from "../jobs/notification.job.js";
import { deadNotificationQueue } from "../queues/notification.queue.js";

/**
 * Worker: Listens for jobs on 'notification_queue' and processes them.
 */
export const startNotificationWorker = () => {
  const worker = new Worker<NotificationJobData>(
    "notification_queue",
    async (job: Job) => {
      console.log(`[NotificationWorker] Processing job ${job.id}`);
      await processNotificationJob(job.data, job.attemptsMade);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[NotificationWorker] Job ${job.id} completed!`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;

    const attempts = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 5;

    console.error(`[NotificationWorker] ❌ Job ${job.id} failed (Attempt ${attempts}/${maxAttempts}): ${err.message}`);

    // If max retries reached, move to Dead Letter Queue (DLQ)
    if (attempts >= maxAttempts) {
      console.log(`[NotificationWorker] ☠️ Moving job ${job.id} to Dead Letter Queue (DLQ) after ${attempts} failures.`);
      
      await deadNotificationQueue.add("dead_notification", {
        originalJobId: job.id,
        data: job.data,
        failedReason: err.message,
        stackTrace: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Notification Worker is ready!");
  return worker;
};

/**
 * ☠️ Dead Notification Worker: Monitors the Dead Letter Queue for manual review or alerting.
 */
export const startDeadNotificationWorker = () => {
  const worker = new Worker(
    "dead_notification_queue",
    async (job: Job) => {
      console.warn(`[DeadNotificationWorker] ⚠️ Dead job detected: ${job.id}`);
      console.warn(`[DeadNotificationWorker] Original Info:`, JSON.stringify(job.data, null, 2));
      
      // Here you could send an alert to Sentry, Email an Admin, or log to a specific DB table
    },
    { 
      connection: redisConnection,
      concurrency: 5 
    }
  );

  console.log("💀 Dead Notification Monitoring is ready!");
  return worker;
};

