import { sendDelayedEmail } from "../utils/delayedMailer.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🧪 Test Script: 5-Minute Delayed Email
 * This will trigger an email to your address with a 5-minute timer.
 */
async function trigger5MinTest() {
    console.log("⏳ Starting 5-Minute Delayed Job Test...");

    const emailData = {
        to: "kunjkhimani13@gmail.com", // Replace with your email if different
        subject: "⏱️ 5-Minute Productivity Test",
        html: "<h1>Test Successful!</h1><p>This email was sent exactly 5 minutes after being triggered.</p>"
    };

    const startTime = new Date();
    const expectedTime = new Date(startTime.getTime() + 5 * 60000);

    console.log(`--- Scheduling email ---`);
    console.log(`Current Time:  ${startTime.toLocaleTimeString()}`);
    console.log(`Expected Play: ${expectedTime.toLocaleTimeString()} (In 5 mins)`);

    await sendDelayedEmail(emailData, 5);

    console.log("\n✅ Job is now in the REDIS 'Delayed' state.");
    console.log("-----------------------------------------");
    console.log("Monitor your 'WORKER' terminal. You will see the job process at the expected time.");
    
    // Exit after enqueuing
    process.exit(0);
}

trigger5MinTest().catch(err => {
    console.error("❌ Test failed to enqueue:", err);
    process.exit(1);
});
