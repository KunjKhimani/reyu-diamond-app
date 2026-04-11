import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processBulkInventoryJob, type BulkInventoryJobData } from "../jobs/bulk-inventory.job.js";
import { logService } from "../services/log.service.js";

export const startBulkInventoryWorker = () => {
  console.log("👷 Bulk Inventory Worker starting...");

  const worker = new Worker(
    "bulk_inventory_queue",
    async (job: Job<BulkInventoryJobData>) => {
      console.log(`[BulkInventoryWorker] Job received: ${job.id}`);
      const result = await processBulkInventoryJob(job.data, job.attemptsMade + 1);

      // Log completion
      await logService.createSystemLog({
        eventType: "JOB_COMPLETED",
        severity: "INFO",
        message: `Bulk processing completed for ID: ${job.data.bulkId}`,
        targetId: job.id as any,
        meta: { jobId: job.id, bulkId: job.data.bulkId }
      });

      return result;
    },
    {
      connection: redisConnection,
      concurrency: 1, 
      lockDuration: 300000, // 5 minutes (bulk can take long)
      stalledInterval: 60000,
      limiter: {
        max: 1,
        duration: 5000
      }
    }
  );

  worker.on("completed", (job) => {
    console.log(`[BulkInventoryWorker] Job ${job.id} completed successfully`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[BulkInventoryWorker] Job ${job?.id} failed:`, err.message);

    if (job) {
      await logService.createSystemLog({
        eventType: "JOB_FAILED",
        severity: "ERROR",
        message: `Bulk inventory job ${job.id} failed: ${err.message}`,
        targetId: job.id as any,
        meta: { jobId: job.id, bulkId: job.data.bulkId, attempt: job.attemptsMade, stack: err.stack }
      });
    }
  });

  console.log("✅ Bulk Inventory Worker registered and listening.");
  return worker;
};
