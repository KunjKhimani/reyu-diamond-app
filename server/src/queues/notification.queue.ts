import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import type { NotificationJobData } from "../jobs/notification.job.js";

const DEFAULT_QUEUE_CONFIG = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

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
