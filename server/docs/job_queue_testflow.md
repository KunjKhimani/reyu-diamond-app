# Job Queue Test Flow

This document provides specific procedures for verifying the job queue system in the Reyu Diamond App environment.

---

## Phase 1: Environment Readiness

Ensure Redis and Workers are operational before testing.

1.  **Check Redis (Docker)**:
    If running Redis via Docker, verify connectivity:
    ```bash
    docker exec -it <container-name> redis-cli ping
    # Expected: PONG
    ```

2.  **Start Workers**:
    The system uses a dedicated worker process. Start it alongside the API:
    ```bash
    npm run dev
    # Or for workers only:
    npm run dev:worker
    ```
    Verify ready logs for all 7 workers (Email, Notification, Cloudinary, Scheduled, and their corresponding DLQs).

---

## Phase 2: Triggering Jobs

### 1. Manual Integration Test
Use the existing test script to enqueue a mock job:
```bash
# This script typically exists in src/tmp or as a pre-compiled utility
node --loader ts-node/esm ./path/to/test_enqueue.ts
```

### 2. Standard API Flow
Trigger a job through the application endpoints:
- **Email**: Send a "Delayed Email" via the `DelayedMailer` utility (e.g., in a development route).
- **Notification**: Trigger a test notification through the notification test route.

---

## Phase 3: Observability & Inspection

### 1. Redis CLI (Docker Based)
Use the following commands to inspect the raw state of BullMQ keys. Replace `email_queue` with the target queue name.

```bash
# Check how many jobs are waiting
docker exec -it <container-name> redis-cli LLEN bull:email_queue:wait

# View the next 5 waiting jobs
docker exec -it <container-name> redis-cli LRANGE bull:email_queue:wait 0 4

# Check the Dead Letter Queue length
docker exec -it <container-name> redis-cli LLEN bull:dead_email_queue:wait
```

### 2. Bull-Board Dashboard
Access the visual monitoring UI:
- **URL**: `http://localhost:5000/admin/queues` (or your configured `PORT`)
- **Action**: Check the "Failed" and "Completed" counts. Verify that your tests appear in the "Active" state while processing.

---

## Phase 4: Advanced Scenarios

### 1. Testing DLQ Transition
This verifies the resilience logic:
1.  Temporarily sabotages a processing job (e.g., by throwing an error in `email.job.ts`).
2.  Trigger the job.
3.  Monitor the Bull-Board details:
    - Observe the job retrying 5 times (Exponential Backoff).
    - After the 5th failure, verify the job is **removed** from `email_queue` and a new job is **added** to `dead_email_queue`.
4.  Verify the `dead_email_queue` logs in the worker console.

### 2. Testing Repeating Jobs
1.  Register a repeatable job using `addRepeatableJob`.
2.  Check the "Repeatable" tab in the Bull-Board dashboard.
3.  Verify the next scheduled execution time matches the Cron pattern.
