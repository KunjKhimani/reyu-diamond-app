import { addEmailJob } from "../queues/email.queue.js";
import type { EmailJobData } from "../jobs/email.job.js";

/**
 * Sends a delayed email after a specified number of minutes.
 * @param data Email content (to, subject, html)
 * @param minutes Delay in minutes (default is 10)
 */
export const sendDelayedEmail = async (data: EmailJobData, minutes: number = 10) => {
  const delayMs = minutes * 60 * 1000;
  console.log(`[DelayedMailer] Scheduling email to ${data.to} in ${minutes} minutes.`);
  return await addEmailJob(data, delayMs);
};

/**
 * Example usage:
 * 
 * await sendDelayedEmail({
 *   to: "user@example.com",
 *   subject: "Welcome to Reyu Diamonds!",
 *   html: "<h1>Welcome!</h1><p>We're glad you're here. Let us know if you need help.</p>"
 * }, 10);
 */
