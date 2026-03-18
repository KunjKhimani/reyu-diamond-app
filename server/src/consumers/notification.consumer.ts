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

      console.log(`Processing notifications for ${users.length} users...`);

      for (const user of users) {
        const userId = user._id.toString();
        
        // Save to DB
        await Notification.create({
          recipient: userId,
          title,
          body,
          data,
          type: data.type || "GENERAL",
        });

        // Send FCM if token exists
        if (user.fcmToken) {
          try {
            await fcm.send({ token: user.fcmToken, notification: { title, body }, data });
          } catch (err: any) {
             if (err.code === "messaging/registration-token-not-registered") {
                await User.updateOne({ _id: userId }, { $unset: { fcmToken: "" } });
             }
          }
        }
      }
      console.log(`Finished processing notifications for auction event.`);
    } catch (error) {
      console.error("Error in notification consumer:", error);
    }
  }
};

export const initNotificationConsumer = async () => {
  await kafkaService.subscribe("notification-events", handleNotificationEvent, 3);
};
