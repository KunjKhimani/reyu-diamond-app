import { redis } from "../config/redis.config.js";
import sendEmail from "../services/email.service.js";

const EMAIL_QUEUE_KEY = "email_queue";

/**
 * Producer: Push email data into the Redis list
 */
export const sendEmailViaQueue = async (data: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  try {
    await redis.lpush(EMAIL_QUEUE_KEY, JSON.stringify(data));
    console.log(`[EmailQueue] Job enqueued for: ${data.to}`);
  } catch (error) {
    console.error("[EmailQueue] Error enqueuing job:", error);
    // Fallback or re-throw
    throw error;
  }
};

/**
 * Consumer: Background loop to process jobs from the Redis list
 */
export const startEmailWorker = async (): Promise<void> => {
  console.log("🚀 Email Worker started... (Manual Mode)");

  // Run indefinitely
  while (true) {
    try {
      // BRPOP waits up to 30 seconds for a new item. 
      // Returns [key, value] or null if timeout.
      const result = await redis.brpop(EMAIL_QUEUE_KEY, 30);
      
      if (result) {
        const [_key, value] = result;
        const data = JSON.parse(value);
        
        console.log(`[EmailQueue] Processing job for: ${data.to}`);
        
        try {
          await sendEmail(data);
          console.log(`[EmailQueue] Successfully sent email to: ${data.to}`);
        } catch (error) {
          console.error(`[EmailQueue] Failed to send email to: ${data.to}`, error);
          // Simple retry: push back to the queue (optional)
          // await redis.lpush(EMAIL_QUEUE_KEY, value);
        }
      }
    } catch (error) {
      console.error("[EmailQueue] Worker Loop Error:", error);
      // Brief pause to prevent rapid-fire errors if Redis is down
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
