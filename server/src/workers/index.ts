import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { startEmailWorker, startDeadEmailWorker } from "./email.worker.js";
import { startNotificationWorker, startDeadNotificationWorker } from "./notification.worker.js";
import { startCloudinaryWorker, startDeadCloudinaryWorker } from "./cloudinary.worker.js";
import { startScheduledWorker } from "./scheduled.worker.js";
import { startBulkInventoryWorker } from "./bulk-inventory.worker.js";


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

    // scheduled tasks
    const scheduledWorker = startScheduledWorker();

    // bulk inventory
    const bulkWorker = startBulkInventoryWorker();

    console.log("🎉 All workers started successfully!");

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Closing workers...`);

      // Set a terminal timeout to force exit if workers take too long to close
      const forceExitTimeout = setTimeout(() => {
        console.warn("⚠️ Forced shutdown initiated after timeout.");
        process.exit(1);
      }, 10000); // 10 seconds

      try {
        // Stop accepting new jobs and wait for current ones to finish
        await Promise.all([
          emailWorker.close(),
          deadEmailWorker.close(),
          notificationWorker.close(),
          deadNotificationWorker.close(),
          cloudinaryWorker.close(),
          deadCloudinaryWorker.close(),
          scheduledWorker.close(),
          bulkWorker.close(),
        ]);

        console.log("✅ All workers closed gracefully.");
        
        // Clear the timeout
        clearTimeout(forceExitTimeout);
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during graceful shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (error) {
    console.error("❌ Failed to initialize workers:", error);
    process.exit(1);
  }
};

initializeWorkers();
