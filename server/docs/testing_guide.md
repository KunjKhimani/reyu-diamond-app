# Redis Queue Testing Guide

To ensure the job queue is working correctly, you can perform manual and integration testing using the following scripts and tools.

## Prerequisites

- **Redis**: Ensure a Redis instance is running (usually on `localhost:6379`).
- **Dev Environment**: The API or Worker process should be running in a terminal.

---

## 1. Manual Testing (Enqueue Script)

There is a dedicated script to test enqueuing jobs in the background.

### Run the Test Enqueue script:
```bash
npm run redis:test-enqueue
```

**What this does:**
1.  Connects to the Redis cluster/instance.
2.  Creates a mock email payload.
3.  Calls `sendEmailViaQueue` to push the data into the production/dev `email_queue` list.
4.  Logs success or failure.

---

## 2. Inspecting Redis Data

You can inspect the state of the queue directly from the terminal.

### Run the Inspect script:
```bash
npm run redis:inspect
```

**What this does:**
- Prints the current length of the `email_queue`.
- Shows a list of the next 5 items waiting to be processed.

### Using Redis CLI:
Alternatively, use `redis-cli` from your terminal:
```bash
# Check length
docker exec -it <container-name> redis-cli LLEN email_queue

# View first 10 items
docker exec -it <container-name> redis-cli LRANGE email_queue 0 9
```

---

## 3. Verifying Processing

To verify that the jobs are being processed:

1.  Start the server normally: `npm run dev`.
2.  In a separate terminal, run `npm run redis:test-enqueue`.
3.  Check the server logs. You should see:
    ```text
    [EmailQueue] Processing job for: test-user@example.com
    [EmailQueue] Successfully sent email to: test-user@example.com
    ```

---

## 4. Disabling workers for isolated testing

If you want to test the queue without the worker automatically consuming jobs:

1.  Run the server with the worker disabled:
    ```bash
    `npm run dev:no-worker`
    ```
2.  Enqueue a job: `npm run redis:test-enqueue`.
3.  Run the inspect script: `npm run redis:inspect`. You should see the job stuck in the queue.
4.  Restart the server without the disable flag to resume processing.
