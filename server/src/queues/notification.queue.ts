import { Queue, type JobsOptions } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";
import type { NotificationJobData } from "../jobs/notification.job.js";

export const notificationQueue = new Queue("notification_queue", DEFAULT_QUEUE_CONFIG);
export const deadNotificationQueue = new Queue("dead_notification_queue", DEFAULT_QUEUE_CONFIG);

/**
 * Producer: Function to enqueue an FCM notification job
 * Supports custom options like delay and priority.
 */
export const sendNotificationViaQueue = async (data: NotificationJobData, options?: JobsOptions) => {
  try {
    const job = await notificationQueue.add("send_fcm_notification", data, options);
    console.log(`[NotificationQueue] FCM Job enqueued: ${job.id}${options?.delay ? ` (delayed ${options.delay}ms)` : ''}`);
    return job;
  } catch (error) {
    console.error("[NotificationQueue] Error enqueuing job:", error);
    throw error;
  }
};
