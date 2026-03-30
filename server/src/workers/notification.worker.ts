import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processNotificationJob, type NotificationJobData } from "../jobs/notification.job.js";

/**
 * Worker: Listens for jobs on 'notification_queue' and processes them.
 */
export const startNotificationWorker = () => {
  const worker = new Worker<NotificationJobData>(
    "notification_queue",
    async (job: Job) => {
      console.log(`[NotificationWorker] Processing job ${job.id}`);
      await processNotificationJob(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[NotificationWorker] Job ${job.id} completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Notification Worker is ready!");
  return worker;
};
