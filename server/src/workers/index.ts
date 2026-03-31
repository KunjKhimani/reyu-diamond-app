import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { startEmailWorker, startDeadEmailWorker } from "./email.worker.js";
import { startNotificationWorker, startDeadNotificationWorker } from "./notification.worker.js";
import { startCloudinaryWorker, startDeadCloudinaryWorker } from "./cloudinary.worker.js";

// 1. Load environment variables
dotenv.config();

// 2. Connect to Database (Required because workers might need to fetch user data, inventory, etc.)
const initializeWorkers = async () => {
  try {
    console.log("🛠️ Initializing Worker Process...");
    
    // Connect to Mongo
    await connectDB();
    console.log("✅ Database connected for Worker process");

    // 3. Start all workers
    // email
    const emailWorker = startEmailWorker();
    const deadEmailWorker = startDeadEmailWorker();

    // notification
    const notificationWorker = startNotificationWorker();
    const deadNotificationWorker = startDeadNotificationWorker();
    
    // cloudinary
    const cloudinaryWorker = startCloudinaryWorker();
    const deadCloudinaryWorker = startDeadCloudinaryWorker();

    console.log("🎉 All workers started successfully!");

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Closing workers...`);

      await emailWorker.close();
      await deadEmailWorker.close();
      
      await notificationWorker.close();
      await deadNotificationWorker.close();
      
      await cloudinaryWorker.close();
      await deadCloudinaryWorker.close();

      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (error) {
    console.error("❌ Failed to initialize workers:", error);
    process.exit(1);
  }
};

initializeWorkers();
