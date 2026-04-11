import Bull from "bull";
import type { Job } from "bull";
import sendEmail from "../services/email.service.js";

// Bull Queue constructor (handles ESM/CJS interop)
const Queue = (Bull as any).default || Bull;

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

// Bull Queue setup
export const emailQueue = new Queue("email_queue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

/**
 * Producer: Add an email job to the Bull queue
 */
export const sendEmailViaQueue = async (data: EmailJobData): Promise<void> => {
  try {
    await emailQueue.add(data, {
      attempts: 3, // Retry up to 3 times if it fails
      backoff: 5000, // Wait 5 seconds between retries
    });
    console.log(`[EmailQueue] Job enqueued for: ${data.to}`);
  } catch (error) {
    console.error("[EmailQueue] Error enqueuing job:", error);
    throw error;
  }
};

/**
 * Consumer: Process jobs from the Bull queue
 */
export const startEmailWorker = (): void => {
  console.log("🚀 Bull Email Worker started...");

  emailQueue.process(async (job: Job<EmailJobData>) => {
    const { to, subject, html } = job.data;
    
    console.log(`[EmailQueue] Processing job ${job.id} for: ${to}`);
    
    try {
      await sendEmail({ to, subject, html });
      console.log(`[EmailQueue] Successfully sent email to: ${to}`);
    } catch (error) {
      console.error(`[EmailQueue] Failed to send email to: ${to}`, error);
      // Throwing error here will trigger Bull's retry mechanism
      throw error;
    }
  });

  // Optional: Event listeners for better monitoring
  emailQueue.on("failed", (job: Job, err: Error) => {
    console.error(`[EmailQueue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
  });
};
