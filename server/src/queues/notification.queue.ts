import Queue from "bull";
import { fcm } from "../config/firebase-admin.config.js";
import User from "../models/User.model.js";

// Bull Queue setup for notifications
export const notificationQueue = new Queue("notification_queue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

interface NotificationJobData {
  userId?: string;
  token?: string;
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
  type: "SINGLE" | "ADMINS";
}

/**
 * Producer: Add a notification job to the Bull queue
 */
export const sendNotificationViaQueue = async (jobData: NotificationJobData): Promise<void> => {
  try {
    await notificationQueue.add(jobData, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  } catch (error) {
    console.error("[NotificationQueue] Error enqueuing job:", error);
    throw error;
  }
};

/**
 * Consumer: Process notification jobs
 */
export const startNotificationWorker = (): void => {
  console.log("🚀 Bull Notification Worker started...");

  notificationQueue.process(async (job) => {
    const { userId, token, notification, data, type } = job.data as NotificationJobData;

    try {
      if (type === "SINGLE") {
        const targetToken = token || (userId ? (await User.findById(userId).select("fcmToken"))?.fcmToken : null);
        
        if (!targetToken) return;

        await fcm.send({ token: targetToken, notification, data });
        console.log(`[NotificationQueue] FCM sent to ${userId || 'token'}: ${notification.title}`);
      } else if (type === "ADMINS") {
        const admins = await User.find({ role: "admin", fcmToken: { $ne: null } }).select("fcmToken");
        
        for (const admin of admins) {
          if (admin.fcmToken) {
            try {
              await fcm.send({ token: admin.fcmToken, notification, data });
            } catch (err: any) {
              console.error(`[NotificationQueue] Admin FCM Error:`, err.message);
              // Clean up stale token
              if (err.code === "messaging/registration-token-not-registered") {
                await User.updateOne({ fcmToken: admin.fcmToken }, { $unset: { fcmToken: "" } });
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`[NotificationQueue] Job ${job.id} failed:`, error.message);
      
      // Clean up stale token on specific FCM errors
      if (error.code === "messaging/registration-token-not-registered" && userId) {
        await User.updateOne({ _id: userId }, { $unset: { fcmToken: "" } });
      }
      
      throw error;
    }
  });

  notificationQueue.on("failed", (job, err) => {
    console.error(`[NotificationQueue] Job ${job.id} failed:`, err.message);
  });
};
