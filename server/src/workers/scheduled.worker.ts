import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

import { cleanupService } from "../services/cleanup.service.js";

/**
 * Scheduled Worker: Processes tasks from 'scheduled_queue'.
 */
export const startScheduledWorker = () => {
  const worker = new Worker(
    "scheduled_queue",
    async (job: Job) => {
      console.log(`[ScheduledWorker] 🕒 Executing scheduled task: ${job.name}`);
      
      switch (job.name) {
        case "daily_cleanup":
          await cleanupService.performDailyCleanup();
          break;
          
        default:
          console.warn(`[ScheduledWorker] task name: ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ScheduledWorker] ✅ Task ${job.name} (ID: ${job.id}) finished.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ScheduledWorker] ❌ Task ${job?.name} failed: ${err.message}`);
  });

  console.log("🚀 Scheduled Task Worker is ready!");
  return worker;
};
