import { sendEmailViaQueue } from "../queues/email.queue.js";

async function testEnqueue() {
  const testData = {
    to: "test-user@example.com",
    subject: "🔍 Bull Queue Integration Test",
    html: `
      <h1>Hello!</h1>
      <p>This is a test email sent to verify Bull Queue storage and processing.</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  };

  try {
    console.log("📨 Enqueuing test email via Bull...");
    await sendEmailViaQueue(testData);
    console.log("✅ Successfully enqueued to Bull Queue.");
    
    // Give it a second to process before exiting
    setTimeout(() => {
        process.exit(0);
    }, 2000);
  } catch (error) {
    console.error("❌ Failed to enqueue email:", error);
    process.exit(1);
  }
}

testEnqueue();
