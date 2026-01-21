import transporter from "../config/email.config.js";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"Reyu Diamond" <${process.env.SENDER_EMAIL}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
