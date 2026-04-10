import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { BulkInventoryJobData } from "../jobs/bulk-inventory.job.js";

export const bulkInventoryQueue = new Queue("bulk_inventory_queue", DEFAULT_QUEUE_CONFIG);

export const addBulkInventoryJob = async (data: BulkInventoryJobData) => {
  try {
    // (with out priority)
    // const job = await bulkInventoryQueue.add("process_bulk_upload", data);
    // console.log(`[BulkInventoryQueue] Job enqueued: ${job.id} for bulkId: ${data.bulkId}`);
    
    // with priority
    const job = await bulkInventoryQueue.add("process_bulk_upload", data, {
      priority: 1, // High priority (lower is higher)
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs for visibility
        age: 24 * 3600, // Or keep for 24 hours
      },
      removeOnFail: {
        count: 500, // Keep failed jobs for manual review
      }
    });
    console.log(`[BulkInventoryQueue] Job enqueued: ${job.id} for bulkId: ${data.bulkId} (Priority: 1)`);
    return job;
  } catch (error) {
    console.error("[BulkInventoryQueue] Error enqueuing job:", error);
    throw error;
  }
};
