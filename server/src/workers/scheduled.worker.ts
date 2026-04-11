import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

import { cleanupService } from "../services/cleanup.service.js";
import { logService } from "../services/log.service.js";

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

      // Log completion
      await logService.createSystemLog({
        eventType: "JOB_COMPLETED",
        severity: "INFO",
        message: `Scheduled task ${job.name} completed`,
        targetId: job.id as any,
        meta: { jobId: job.id, task: job.name }
      });
    },
    {
      connection: redisConnection,
      concurrency: 2,
      lockDuration: 300000,   // 5 minutes
      stalledInterval: 60000,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ScheduledWorker] ✅ Task ${job.name} (ID: ${job.id}) finished.`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[ScheduledWorker] ❌ Task ${job?.name} failed: ${err.message}`);

    if (job) {
      await logService.createSystemLog({
        eventType: "JOB_FAILED",
        severity: "ERROR",
        message: `Scheduled task ${job.name} failed: ${err.message}`,
        targetId: job.id as any,
        meta: { jobId: job.id, task: job.name, stack: err.stack }
      });
    }
  });

  console.log("🚀 Scheduled Task Worker is ready!");
  return worker;
};
