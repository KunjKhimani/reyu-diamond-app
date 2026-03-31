import sendEmail from "../services/email.service.js";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export const processEmailJob = async (data: EmailJobData, attempts: number = 0): Promise<void> => {
  const { to, subject, html } = data;
  console.log(`[EmailJob] Sending email to: ${to} (Attempt ${attempts + 1})`);
  
  try {
    await sendEmail({ to, subject, html, attempts });
    console.log(`[EmailJob] Successfully sent email to: ${to}`);
  } catch (error) {
    console.error(`[EmailJob] Failed to send email to: ${to}`, error);
    throw error; // Let BullMQ handle retries
  }
};
