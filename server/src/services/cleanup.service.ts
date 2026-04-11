import fs from "fs";
import path from "path";
import { SystemLog } from "../models/SystemLog.model.js";
import { AdminLog } from "../models/AdminLog.model.js";
import Notification from "../models/Notification.model.js";

class CleanupService {
    /**
     * Performs all daily cleanup tasks
     */
    async performDailyCleanup() {
        console.log("[CleanupService] Starting daily system cleanup...");
        const startTime = Date.now();

        try {
            // 1. Clean up old logs (30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const systemLogResult = await SystemLog.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });
            console.log(`[CleanupService] Deleted ${systemLogResult.deletedCount} old system logs.`);

            const adminLogResult = await AdminLog.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });
            console.log(`[CleanupService] Deleted ${adminLogResult.deletedCount} old admin logs.`);

            // 2. Clean up old notifications (30 days)
            const notificationResult = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });
            console.log(`[CleanupService] Deleted ${notificationResult.deletedCount} old notifications.`);

            // 3. Clean up stale temporary files (24 hours)
            await this.cleanupTempFiles();

            const duration = (Date.now() - startTime) / 1000;
            console.log(`[CleanupService] Daily cleanup completed successfully in ${duration}s.`);
        } catch (error) {
            console.error("[CleanupService] Error during daily cleanup:", error);
            throw error;
        }
    }

    /**
     * Deletes files in uploads/temp that are older than 24 hours
     */
    private async cleanupTempFiles() {
        const tempDir = path.join(process.cwd(), "src", "uploads", "temp");
        
        if (!fs.existsSync(tempDir)) {
            console.log("[CleanupService] Temp directory does not exist, skipping file cleanup.");
            return;
        }

        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        let deletedFilesCount = 0;

        try {
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);

                if (stats.isFile() && stats.mtimeMs < twentyFourHoursAgo) {
                    fs.unlinkSync(filePath);
                    deletedFilesCount++;
                }
            }
            console.log(`[CleanupService] Deleted ${deletedFilesCount} stale temporary files.`);
        } catch (error) {
            console.error("[CleanupService] Error cleaning up temporary files:", error);
        }
    }
}

export const cleanupService = new CleanupService();
