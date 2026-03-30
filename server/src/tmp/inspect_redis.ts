import Queue from "bull";

async function inspectBullQueue() {
  const emailQueue = new Queue("email_queue", {
    redis: { host: "127.0.0.1", port: 6379 },
  });

  try {
    console.log("🔍 Connecting to Bull Queue: email_queue...");
    
    // Get job counts
    const counts = await emailQueue.getJobCounts();
    console.log("📊 Job Counts:", counts);

    // Get waiting jobs (these are in the queue but not processed yet)
    const waitingJobs = await emailQueue.getWaiting();
    console.log(`\n⏳ Waiting Jobs (${waitingJobs.length}):`);
    waitingJobs.forEach((job, i) => {
      console.log(`[${i + 1}] ID: ${job.id}, Data:`, job.data);
    });

    // Get active jobs (currently being processed)
    const activeJobs = await emailQueue.getActive();
    console.log(`\n🚀 Active Jobs (${activeJobs.length}):`);
    activeJobs.forEach((job, i) => {
      console.log(`[${i + 1}] ID: ${job.id}, Data:`, job.data);
    });

    // Get failed jobs
    const failedJobs = await emailQueue.getFailed();
    if (failedJobs.length > 0) {
        console.log(`\n❌ Failed Jobs (${failedJobs.length}):`);
        failedJobs.forEach((job, i) => {
            console.log(`[${i + 1}] ID: ${job.id}, Reason: ${job.failedReason}`);
        });
    }

    console.log("\n✅ Done.");
  } catch (error) {
    console.error("❌ Error inspecting Bull Queue:", error);
  } finally {
    await emailQueue.close();
    process.exit(0);
  }
}

inspectBullQueue();
