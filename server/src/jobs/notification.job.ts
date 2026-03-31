import User from "../models/User.model.js";
import { fcm } from "../config/firebase-admin.config.js";

export interface NotificationJobData {
  userId?: string;
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
  type: "SINGLE" | "ADMINS";
  attemptsMade?: number;
}

export const processNotificationJob = async (jobData: NotificationJobData, attemptsMade: number = 0): Promise<void> => {
  const { userId, notification, data, type } = jobData;
  console.log(`[NotificationJob] Processing notification for ${type} user ${userId} (Attempt ${attemptsMade + 1})`);

  // 🧪 TEMPORARY TEST TRIGGER
  if (notification.title === "FAIL_TEST") {
    throw new Error("Simulated notification failure for retry testing");
  }

  try {

    if (type === "SINGLE" && userId) {
      // 1. Send via FCM to a single user
      const user = await User.findById(userId).select("fcmToken");
      if (user?.fcmToken) {
        try {
          await fcm.send({ token: user.fcmToken, notification, data });
          console.log(`[NotificationJob] FCM sent to user ${userId}`);
        } catch (fcmError: any) {
          console.error(`[NotificationJob] FCM Error for user ${userId}:`, fcmError.message);
          if (
            fcmError.code === "messaging/registration-token-not-registered" ||
            fcmError.message?.includes("SenderId mismatch") ||
            fcmError.code === "messaging/mismatched-credential"
          ) {
            await User.updateOne({ _id: userId }, { $unset: { fcmToken: "" } });
          }
        }
      }
    } else if (type === "ADMINS") {
      // 2. Broadcast FCM to all admins
      const admins = await User.find({ role: "admin", fcmToken: { $ne: null } }).select("_id fcmToken");
      for (const admin of admins) {
        if (!admin.fcmToken) continue;
        try {
          await fcm.send({ token: admin.fcmToken, notification, data });
          console.log(`[NotificationJob] FCM sent to admin ${admin._id}`);
        } catch (fcmError: any) {
          console.error(`[NotificationJob] FCM Error for admin ${admin._id}:`, fcmError.message);
          if (
            fcmError.code === "messaging/registration-token-not-registered" ||
            fcmError.message?.includes("SenderId mismatch") ||
            fcmError.code === "messaging/mismatched-credential"
          ) {
            await User.updateOne({ _id: admin._id }, { $unset: { fcmToken: "" } });
          }
        }
      }
    }
  } catch (error) {
    console.error(`[NotificationJob] Unexpected error during job processing`, error);
    throw error;
  }
};
