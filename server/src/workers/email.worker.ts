import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processEmailJob, type EmailJobData } from "../jobs/email.job.js";

/**
 * Worker: Listens for jobs on 'email_queue' and processes them.
 */
export const startEmailWorker = () => {
  const worker = new Worker<EmailJobData>(
    "email_queue",
    async (job: Job) => {
      console.log(`[EmailWorker] Processing job ${job.id}`);
      await processEmailJob(job.data);
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs at a time
    }
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Email Worker is ready!");
  return worker;
};
