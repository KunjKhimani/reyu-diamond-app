import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { NotificationJobData } from "../jobs/notification.job.js";


export const notificationQueue = new Queue("notification_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Producer: Function to enqueue an FCM notification job
 */
export const sendNotificationViaQueue = async (data: NotificationJobData) => {
  try {
    const job = await notificationQueue.add("send_fcm_notification", data);
    console.log(`[NotificationQueue] FCM Job enqueued: ${job.id} for type ${data.type}`);
    return job;
  } catch (error) {
    console.error("[NotificationQueue] Error enqueuing job:", error);
    throw error;
  }
};
