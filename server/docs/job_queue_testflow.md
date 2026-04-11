# Job Queue Test Flow

This document provides a step-by-step procedure for verifying the background processing system. Follow this flow to ensure your queues and workers are performing as expected.

---

## Phase 1: Environment Readiness

Before testing, ensure your local environment is correctly configured.

1.  **Check Redis**:
    Ensure Redis is running on `localhost:6379`.
    ```bash
    # Test connection
    redis-cli ping
    # Expected: PONG
    ```

2.  **Start Workers**:
    In a separate terminal, start the background worker process.
    ```bash
    npm run dev:worker
    ```
    Verify that you see the ready logs:
    - `🚀 Email Worker is ready!`
    - `🚀 Notification Worker is ready!`

---

## Phase 2: Triggering a Job

There are two main ways to trigger a job for testing:

### 1. Automated (API-driven)
Trigger a job by performing an action in the application that uses a queue.
- **Example**: Register a new user to trigger a welcome email.
- **Command**: Use Postman or `curl` to hit the registration endpoint.

### 2. Manual (Script-driven)
Use a standalone script to enqueue a job without needing the full API flow. This is ideal for isolated logic testing.

Create a temporary script `src/tmp/test_enqueue.ts`:
```typescript
import { addEmailJob } from "../queues/email.queue.js";

async function test() {
  await addEmailJob({
    to: "test@example.com",
    subject: "Test Flow Verification",
    html: "<p>The BullMQ system is working!</p>"
  });
  process.exit(0);
}
test();
```
Run it with: `node --loader ts-node/esm src/tmp/test_enqueue.ts`

---

## Phase 3: Observability & Inspection

Once a job is triggered, verify its state using these methods:

### 1. Terminal Logs
Monitor the process where `npm run dev:worker` is running.
- **Log**: `[EmailWorker] Processing job <ID>`
- **Log**: `[EmailWorker] Job <ID> completed!`

### 2. Redis Inspection (Manual)
Use the Redis CLI to see the raw state of the queues.
```bash
# Check how many jobs are waiting in the email queue
docker exec -it <container-name> redis-cli LLEN email_queue:*

# View the next 5 jobs in the 'wait' list
docker exec -it <container-name> redis-cli LRANGE bull:email_queue:wait 0 4
```

### 3. Dashboard Monitoring (UI)
The most user-friendly way to monitor processing.
- **URL**: `http://localhost:5000/admin/queues`
- Review the status of all queues (Waiting, Active, Completed, Failed).

---

## Phase 4: Advanced Scenarios

Verify the resilience and cleanup logic of the system.

### 1. Testing Retries (Exponential Backoff)
1.  Temporarily "break" the processing logic (e.g., throw a new error in `email.job.ts`).
2.  Trigger a job.
3.  Observe the **Failed** column in the Dashboard.
4.  Wait 5 seconds and observe it retrying (the `attempts` count in the job details will increase).

### 2. Verifying Cleanup
Check the Redis keys after a job completes.
- In `src/config/queue.config.ts`, `removeOnComplete: true` is set by default.
- Verify that jobs are removed from the `wait` and `active` lists after successful processing.

### 3. Testing Concurrency
Trigger 50 jobs simultaneously using a loop in a test script. Verify that the worker processes them according to the `concurrency` setting (default: 5) rather than all at once.
