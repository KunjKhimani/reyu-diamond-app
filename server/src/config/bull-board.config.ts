import { Router } from 'express';
import { createBullBoard } from 'bull-board';
import { BullAdapter } from 'bull-board/BullAdapter.js';
import { emailQueue } from '../queues/email.queue.js';
import { notificationQueue } from '../queues/notification.queue.js';

// Setup Bull-board with the email queue
const { router } = createBullBoard([
  new BullAdapter(emailQueue),
  new BullAdapter(notificationQueue)
]);

const bullBoardRouter = router as unknown as Router;

export { bullBoardRouter };
