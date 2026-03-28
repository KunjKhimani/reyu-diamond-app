import { sendEmailViaQueue } from "../queues/email.queue.js";

async function testEnqueue() {
  const testData = {
    to: "test-user@example.com",
    subject: "🔍 Redis Data Inspection Test",
    html: `
      <h1>Hello!</h1>
      <p>This is a test email sent to verify Redis storage.</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  };

  try {
    console.log("📨 Enqueuing test email...");
    await sendEmailViaQueue(testData);
    console.log("✅ Successfully enqueued to Redis.");
    
    // Disconnect to exit cleanly
    const { redis } = await import("../config/redis.config.js");
    redis.disconnect();
  } catch (error) {
    console.error("❌ Failed to enqueue email:", error);
    process.exit(1);
  }
}

testEnqueue();
