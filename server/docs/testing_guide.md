# Redis Queue Testing Guide

To ensure the job queue is working correctly, you can perform manual and integration testing using the following scripts and tools.

## Prerequisites

- **Redis**: Ensure a Redis instance is running (usually on `localhost:6379`).
- **Development Environment**: The API or Worker process should be capable of running (check `.env` for configuration).

---

## 1. Manual Testing (Enqueue Script)

There is a dedicated script to test enqueuing jobs in the background using the Bull library.

### Run the Test Enqueue script:
```bash
npm run redis:test-enqueue
```

**What this does:**
1.  Connects to the Redis instance.
2.  Creates a mock email payload.
3.  Calls `sendEmailViaQueue` to push the data into the production/dev `email_queue`.
4.  Logs the Job ID upon successful enqueuing.

---

## 2. Inspecting Queue Data

You can inspect the state of the queue directly from the terminal without using the UI.

### Run the Inspect script:
```bash
npm run redis:inspect
```

**What this does:**
- Prints job counts grouped by status (Waiting, Active, Failed, Completed).
- Shows details for the first few **Waiting** jobs (queued but not processed).
- Shows details for currently **Active** jobs.
- Lists recent **Failed** jobs with their failure reasons.

### Using Redis CLI:
If you want to look at the raw data (caution: Bull uses internal data structures):
```bash
# List all keys related to the email queue
docker exec -it <container-name> redis-cli LLEN email_queue:*
```

---

## 3. Verifying Processing

To verify that jobs are being processed in real-time:

1.  Start the server normally: `npm run dev`.
2.  In a separate terminal, run: `npm run redis:test-enqueue`.
3.  Check the server logs. You should see:
    ```text
    [EmailQueue] Job enqueued for: test-user@example.com
    🚀 Bull Email Worker started...
    [EmailQueue] Processing job <ID> for: test-user@example.com
    [EmailQueue] Successfully sent email to: test-user@example.com
    ```

---

## 4. Disabling Workers for Isolated Testing

If you want to test the queue storage without the worker automatically consuming jobs:

1.  Stop any running server instances.
2.  Run the server with the worker disabled:
    ```bash
    npm run dev:no-worker
    ```
3.  Enqueue a job: `npm run redis:test-enqueue`.
4.  Run the inspect script: `npm run redis:inspect`. You should see the job count increase in the **Waiting** category.
5.  Check the Bull-board UI (`/admin/queues`): The job will stay in the "Waiting" column.
6.  Restart the server normally (without `dev:no-worker`) to resume processing.

---

## 5. Visual Monitoring

For the most comprehensive view, use the integrated dashboard:
- Navigate to: `http://localhost:5000/admin/queues` (or your configured port).
- Here you can manually **Retry** failed jobs or **Clean** the queue.
