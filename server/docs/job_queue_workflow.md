# Job Queue Architecture & Workflow

This document explains **how**, **where**, and **when** to work with the background job processing system in the Reyu Diamond App.

## Overview

The application uses **BullMQ** (powered by Redis) for high-performance background job processing. This architecture follows a **Producer-Consumer pattern**:
- **Producers**: Code that creates and adds jobs to a queue (e.g., an API endpoint adding an email task).
- **Consumers (Workers)**: Isolated logic that listens for jobs on a queue and executes them in the background.

---

## Where to Work

All job-related files are located in the `server/src` directory:

| Directory | Purpose | Examples |
| :--- | :--- | :--- |
| **`src/queues/`** | **Producer Definitions**: Where you initialize the `Queue` and define the standard "Add Job" function. | `email.queue.ts`, `cloudinary.queue.ts` |
| **`src/workers/`** | **Consumer Definitions**: Where you initialize the `Worker` to listen for jobs and process them. | `email.worker.ts`, `cloudinary.worker.ts` |
| **`src/jobs/`** | **Logic & Types**: Where you define the job data structure (interfaces) and the actual business logic. | `email.job.ts`, `notification.job.ts` |
| **`src/config/`** | **Global Settings**: Shared Redis and Queue configurations. | `redis.config.ts`, `queue.config.ts` |

---

## How to Work: Adding a New Task

To add a new background task, follow these four steps:

### Step 1: Define Job Data & Logic
Create a file in `src/jobs/` (e.g., `report.job.ts`). Define the data the job needs and the function that processes it.
```typescript
export interface ReportData {
  userId: string;
  format: 'PDF' | 'CSV';
}

export const processReportJob = async (data: ReportData) => {
  // Logic to generate report...
  console.log(`Generating ${data.format} for user ${data.userId}`);
};
```

### Step 2: Initialize the Queue (Producer)
Create a file in `src/queues/` (e.g., `report.queue.ts`).
```typescript
import { Queue } from "bullmq";
import { DEFAULT_QUEUE_CONFIG } from "../config/queue.config.js";

export const reportQueue = new Queue("report_queue", DEFAULT_QUEUE_CONFIG);

export const addReportJob = async (data: ReportData) => {
  return await reportQueue.add("generate_report", data);
};
```

### Step 3: Create and Register the Worker (Consumer)
Create `src/workers/report.worker.ts` to process the job.
```typescript
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processReportJob, type ReportData } from "../jobs/report.job.js";

export const startReportWorker = () => {
  return new Worker<ReportData>("report_queue", async (job) => {
    await processReportJob(job.data);
  }, { connection: redisConnection });
};
```
Then, register it in `src/workers/index.ts` to ensure it starts with the worker process.

### Step 4: Trigger the Task
Import your `addJob` function in any controller or service:
```typescript
import { addReportJob } from "../queues/report.queue.js";

// Inside an async controller function:
await addReportJob({ userId: '123', format: 'PDF' });
```

---

## When to Work: Guidelines

Moving tasks to the background is crucial for application performance. Use the following rules:

1.  **External API Calls**: Tasks like sending emails, push notifications (FCM) should **always** be background jobs as external services can be slow or intermittently fail.
2.  **Resource-Heavy Operations**: Image resizing, video transcoding (Cloudinary), or generating large PDF reports.
3.  **Delayed Tasks**: Any task that needs to happen at a specific time in the future (e.g., "send an email in 5 minutes").
4.  **Non-Blocking Tasks**: Any task that isn't required for the current HTTP response to be successful (e.g., incrementing a view counter on a rare item).

---

## Basic Testing

### Checklist
- [ ] **Redis Connection**: Is yours local Redis running? (`redis-server`)
- [ ] **Worker Status**: Check the terminal logs for `🚀 Email/Notification Worker is ready!`.
- [ ] **Enqueue Success**: Verify `[Queue] Job enqueued: <ID>` appears in the API logs.
- [ ] **Processing Output**: Verify the "Processing job" logs appear in the Worker process terminal.
- [ ] **Error Handling**: Throw an error in your logic to verify the job retries automatically (check configurations for `attempts`).

### Monitoring UI
Navigate to `/admin/queues` (if Bull-Board is enabled) to visually monitor the state of all queues, failed jobs, and processing throughput.
