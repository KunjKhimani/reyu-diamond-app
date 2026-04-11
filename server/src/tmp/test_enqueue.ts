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
    
    console.log("\n TIPS:");
    console.log("- Run 'npm run redis:inspect' to see the queued data.");
    console.log("- Ensure your server ('npm run dev') is running to process this email.");
    
    // Disconnect to exit cleanly
    const { redis } = await import("../config/redis.config.js");
    redis.disconnect();
  } catch (error) {
    console.error("❌ Failed to enqueue email:", error);
    process.exit(1);
  }
}

testEnqueue();
