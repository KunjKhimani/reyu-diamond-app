import { addEmailJob } from "../queues/email.queue.js";
import { addClodinaryJob } from "../queues/cloudinary.queue.js";
import { sendNotificationViaQueue } from "../queues/notification.queue.js";

async function triggerAll() {
  console.log("🚀 Triggering failing jobs for retry and DLQ testing...");

  // 1. Email Job Failure
  try {
    await addEmailJob({
      to: "kunjkhimani13@gmail.com",
      subject: "Test Retry Logic",
      html: "<h1>Should fail and retry</h1>"
    });
    console.log("✅ Email Job enqueued!");
  } catch (err) {
    console.error("❌ Failed to enqueue Email job:", err);
  }

  // 2. Cloudinary Job Failure
  try {
    await addClodinaryJob({
      action: "delete",
      publicId: "FAIL_TEST",
      resourceType: "image"
    });
    console.log("✅ Cloudinary Job enqueued!");
  } catch (err) {
    console.error("❌ Failed to enqueue Cloudinary job:", err);
  }

  // 3. Notification Job Failure
  try {
    await sendNotificationViaQueue({
      type: "SINGLE",
      userId: "60d0fe4f5311236168a109ca", // Dummy ID
      notification: {
        title: "FAIL_TEST",
        body: "This should fail and retry"
      },
      data: { key: "value" }
    });
    console.log("✅ Notification Job enqueued!");
  } catch (err) {
    console.error("❌ Failed to enqueue Notification job:", err);
  }

  console.log("\nDone! Watch your dev server terminal for retry logs and DLQ transitions.");
}

triggerAll()
  .then(() => {
    // Wait a bit for logs to flush
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(console.error);
