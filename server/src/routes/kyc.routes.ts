import { Router } from "express";
import upload from "../middlewares/upload.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { submitKyc } from "../controllers/kyc.controller.js";

const router = Router();

const kycUploadMiddleware = upload.fields([
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
]);

router.post("/submit", authMiddleware, kycUploadMiddleware, submitKyc);

export default router;

