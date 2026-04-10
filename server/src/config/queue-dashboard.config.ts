import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from '../queues/email.queue.js';
import { notificationQueue } from '../queues/notification.queue.js';
import { cloudinaryQueue } from '../queues/cloudinary.queue.js';
import { scheduledQueue } from '../queues/scheduled.queue.js';
import { bulkInventoryQueue } from '../queues/bulk-inventory.queue.js';

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(cloudinaryQueue),
    new BullMQAdapter(scheduledQueue),
    new BullMQAdapter(bulkInventoryQueue),
  ],
  serverAdapter: serverAdapter,
});

export const boardRouter = serverAdapter.getRouter();
