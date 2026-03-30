import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase-admin.config.js";
import routes from './routes/index.routes.js';
import { connectDB } from './config/db.js';
import { createServer } from "http";
import { initSocket } from "./socket.js";
import { stripeWebhookHandler } from "./controllers/stripe.controller.js";
import { initAuctionCron } from "./cron/auction.cron.js";
import { initPaymentCron } from "./cron/payment.cron.js";
import { initAdvertisementCron } from "./cron/advertisement.cron.js";
import { logService } from "./services/log.service.js";

dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
// initAuctionCron();
// initPaymentCron();
// initAdvertisementCron();

const app = express();
const httpServer = createServer(app);

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Firebase connection
app.get("/test-firebase", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("test").get();
    res.json({ count: snapshot.size });
  } catch (error: any) {
    await logService.createSystemLog({
      eventType: "SYSTEM_EXCEPTION",
      targetId: null as any,
      severity: "CRITICAL",
      message: error.message || "Firebase connection failed",
      meta: { stack: error.stack, path: req.path, method: req.method }
    });
    res.status(500).json({ error: error.message });
  }
});

// api routes
app.use('/api', routes);

// Global Error Handler
app.use(async (err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error("Global Error:", err);

  await logService.createSystemLog({
    eventType: "SYSTEM_EXCEPTION",
    targetId: null as any,
    severity: "CRITICAL",
    message: err.message || "Unhandled System Exception",
    meta: { stack: err.stack, path: req.path, method: req.method }
  });

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
