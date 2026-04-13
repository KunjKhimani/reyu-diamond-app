# Job Queue & Redis Integration Guide

This document is the comprehensive guide for the background processing system in the Reyu Diamond App. It reflects the **actual production architecture**, including specialized features like Dead Letter Queues (DLQ).

---

## 1. Architecture Overview

The system follows a **Producer-Consumer** pattern powered by **BullMQ** and **Redis**:

1.  **Producer (API)**: The main application (Express) adds jobs to a Redis queue.
2.  **Infrastructure (Redis)**: Acts as a message broker, holding jobs in various states (Wait, Active, Completed, Failed, Delayed).
3.  **Consumer (Worker)**: Robust Node.js workers that listen to the queue and execute the job logic.
4.  **Resilience (DLQ)**: If a job fails after the maximum number of retries, it is automatically moved to a **Dead Letter Queue (DLQ)** for manual review and alerting.

---

## 2. Directory Map (Where to Work)

| Directory | Purpose | Key Files |
| :--- | :--- | :--- |
| **`src/queues/`** | **Producers**: Define main and dead-letter queues. | `email.queue.ts`, `notification.queue.ts`, `cloudinary.queue.ts`, `scheduled.queue.ts` |
| **`src/workers/`** | **Consumers**: Dedicated workers for processing and monitoring DLQs. | `email.worker.ts`, `notification.worker.ts`, `cloudinary.worker.ts`, `scheduled.worker.ts`, `index.ts` |
| **`src/jobs/`** | **Logic & Types**: Business logic separated from infrastructure. | `email.job.ts`, `notification.job.ts`, `cloudinary.job.ts` |
| **`src/config/`** | **Configuration**: Redis and dashboard settings. | `redis.config.ts`, `queue.config.ts`, `queue-dashboard.config.ts` |

---

## 3. The Queue List

The application manages the following active queues:

| Queue Name | Purpose | Retries | DLQ Supported |
| :--- | :--- | :--- | :--- |
| `email_queue` | System emails (welcome, invoice, etc.) | 5 (Exponential) | ✅ `dead_email_queue` |
| `notification_queue` | FCM Push Notifications | 5 (Exponential) | ✅ `dead_notification_queue` |
| `cloudinary_queue` | Media uploads and processing | 5 (Exponential) | ✅ `dead_cloudinary_queue` |
| `scheduled_queue` | Recurring cron-like tasks | 5 (Exponential) | ❌ |

---

## 4. How to Work: Adding a Job

To add a new background task, follow the established pattern used in existing modules:

### Step 1: Define Job Logic in `src/jobs/`
Define the data interface and the processing function.
```typescript
export interface MyJobData { id: string; }
export const processMyJob = async (data: MyJobData, attempt: number) => {
  // logic...
};
```

### Step 2: Initialize Queue and Dead Letter Queue in `src/queues/`
```typescript
export const myQueue = new Queue("my_queue", DEFAULT_QUEUE_CONFIG);
export const deadMyQueue = new Queue("dead_my_queue", DEFAULT_QUEUE_CONFIG);

export const addMyJob = async (data: MyJobData, options?: JobsOptions) => {
  return await myQueue.add("my_task", data, options);
};
```

### Step 3: Trigger the Job
```typescript
import { addAuditJob } from "./queues/audit.queue.js";

// Instant job
await addAuditJob({ action: 'LOGIN', timestamp: new Date() });

// Delayed job (e.g., 5 minutes)
await addAuditJob({ action: 'FOLLOW_UP' }, { delay: 300000 });

// Low priority job
await addAuditJob({ action: 'CLEANUP' }, { priority: 10 });
```

---

## 4. Advanced Features: Delay, Priority & Cron

### Job Delays
Use the `delay` option (in milliseconds) to schedule a task for the future.
- **5 Minutes**: `300,000` ms
- **10 Minutes**: `600,000` ms

```typescript
await addEmailJob(emailData, { delay: 600000 }); // 10 min delay
```

### Job Priorities
The `priority` option is a number where **lower values have higher priority**.
- `priority: 1`: Processed first.
- `priority: 10`: Processed after all priority 1-9 jobs are done.

```typescript
await addNotificationJob(data, { priority: 1 }); // Urgent notification
```

---

## 5. Testing Flow

### Local Setup
1.  **Start Redis**: Ensure Docker or local Redis is running.
2.  **Start Workers**: Run `npm run dev` (starts both API and workers) or `npm run dev:worker` (workers only).

### Verification
1.  **Terminal Logs**: Watch for `[EmailWorker] Processing job...` logs.
2.  **Redis CLI**:
    ```bash
    # View waiting jobs in a Docker container
    docker exec -it <redis-container> redis-cli LLEN bull:email_queue:wait
    ```
3.  **Bull-Board Dashboard**:
    Navigate to `http://localhost:5000/admin/queues` to see a visual map of all jobs.

---

## 6. Guidelines: When to use Jobs?

- **External API Calls**: Mailers, SMS, Push Notifications.
- **Expensive Processing**: PDF generation, Image/Video resizing.
- **Atomicity**: When an action shouldn't block the main HTTP response.
- **Scheduled Tasks**: "Remind me in 1 hour".
