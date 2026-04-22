import type { EachMessageHandler } from "kafkajs";
import { kafkaService } from "../services/kafka.service.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import { fcm } from "../config/firebase-admin.config.js";

const handleNotificationEvent: EachMessageHandler = async ({ topic, partition, message }) => {
  if (!message.value) return;
  
  const event = JSON.parse(message.value.toString());
  const { type, payload } = event;

  console.log(`Received notification event: ${type}`);

  if (type === "KAFKA_TEST") {
    console.log("SUCCESS: Kafka Test Event Received!", payload);
    return;
  }

  if (type === "NEW_AUCTION_ALL") {
    const { title, body, data, excludeUserId } = payload;
    
    try {
      const users = await User.find({
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      }).select("_id fcmToken");

      console.log(`Processing notifications for ${users.length} users in batches...`);

      const notificationDocs = [];
      const fcmTokens: string[] = [];

      for (const user of users) {
        const userId = user._id.toString();
        
        // Prepare DB Doc
        notificationDocs.push({
          recipient: userId,
          title,
          body,
          data,
          type: data.type || "GENERAL",
        });

        if (user.fcmToken) {
          fcmTokens.push(user.fcmToken);
        }
      }

      // 1. Batch Insert Notifications into DB
      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs, { ordered: false });
        console.log(`Saved ${notificationDocs.length} notifications to database.`);
      }

      // 2. Multicast FCM (Max 500 tokens per call)
      if (fcmTokens.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < fcmTokens.length; i += chunkSize) {
          const chunk = fcmTokens.slice(i, i + chunkSize);
          try {
            const response = await fcm.sendEachForMulticast({
              tokens: chunk,
              notification: { title, body },
              data
            });
            
            // Handle stale tokens
            if (response.failureCount > 0) {
              const tokensToRemove: string[] = [];
              response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error) {
                  const err = resp.error as any;
                  if (err.code === "messaging/registration-token-not-registered") {
                    tokensToRemove.push(chunk[idx]!);
                  }
                }
              });
              
              if (tokensToRemove.length > 0) {
                await User.updateMany(
                  { fcmToken: { $in: tokensToRemove } },
                  { $unset: { fcmToken: "" } }
                );
              }
            }
          } catch (fcmErr) {
            console.error("Batch FCM error:", fcmErr);
          }
        }
      }

      console.log(`Finished processing all notifications.`);
    } catch (error) {
      console.error("Error in notification consumer:", error);
    }
  }
};

export const initNotificationConsumer = async () => {
  // Subscribe with concurrency for horizontal scaling (if multiple server instances are running)
  await kafkaService.subscribe("notification-events", handleNotificationEvent, 3);
};
