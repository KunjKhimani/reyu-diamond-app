import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { startEmailWorker } from "./email.worker.js";
import { startNotificationWorker } from "./notification.worker.js";
import { startCloudinaryWorker } from "./cloudinary.worker.js";


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
    const emailWorker = startEmailWorker();
    const notificationWorker = startNotificationWorker();
    const cloudinaryWorker = startCloudinaryWorker();


    console.log("🎉 All workers started successfully!");

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Closing workers...`);
      await emailWorker.close();
      await notificationWorker.close();
      await cloudinaryWorker.close();

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
