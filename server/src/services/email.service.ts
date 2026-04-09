import transporter from "../config/email.config.js";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attempts?: number;
}

const sendEmail = async ({ to, subject, html, attempts = 0 }: SendEmailOptions): Promise<void> => {
  // if (to === "kunjkhimani13@gmail.com" && attempts < 4) {
  //   throw new Error(`Simulated failure (Attempt ${attempts + 1}/5)`);
  // }

  await transporter.sendMail({
    from: `"Reyu Diamond" <${process.env.SENDER_EMAIL}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
