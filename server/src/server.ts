import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebase-admin.config.js";
import routes from './routes/index.routes.js';
import { connectDB } from './config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();

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
    res.status(500).json({ error: error.message });
  }
});

// api routes
app.use('/api', routes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
