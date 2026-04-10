import { Worker, type Job } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import { processBulkInventoryJob, type BulkInventoryJobData } from "../jobs/bulk-inventory.job.js";

export const startBulkInventoryWorker = () => {
  console.log("👷 Bulk Inventory Worker starting...");

  const worker = new Worker(
    "bulk_inventory_queue",
    async (job: Job<BulkInventoryJobData>) => {
      console.log(`[BulkInventoryWorker] Job received: ${job.id}`);
      return await processBulkInventoryJob(job.data, job.attemptsMade + 1);
    },
    {
      ...DEFAULT_QUEUE_CONFIG,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[BulkInventoryWorker] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[BulkInventoryWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("✅ Bulk Inventory Worker registered and listening.");
  return worker;
};
