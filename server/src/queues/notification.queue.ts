import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { NotificationJobData } from "../jobs/notification.job.js";

export const notificationQueue = new Queue("notification_queue", DEFAULT_QUEUE_CONFIG);
export const deadNotificationQueue = new Queue("dead_notification_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Producer: Function to enqueue an FCM notification job
 */
export const sendNotificationViaQueue = async (data: NotificationJobData) => {
  try {
    const job = await notificationQueue.add("send_fcm_notification", data, {
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // Or keep for 24 hours
      },
      removeOnFail: {
        count: 500, // Keep failed jobs for manual review
      }
    });
    console.log(`[NotificationQueue] FCM Job enqueued: ${job.id} for type ${data.type}`);
    return job;
  } catch (error) {
    console.error("[NotificationQueue] Error enqueuing job:", error);
    throw error;
  }
};
