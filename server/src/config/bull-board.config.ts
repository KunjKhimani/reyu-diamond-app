import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from '../queues/email.queue.js';
import { notificationQueue } from '../queues/notification.queue.js';

// 1. Initialize the Express Adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// 2. Setup Bull-board with the queues and the adapter
createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(notificationQueue)
  ],
  serverAdapter: serverAdapter,
});

// 3. Export the router from the adapter
const bullBoardRouter = serverAdapter.getRouter() as unknown as Router;

export { bullBoardRouter };
