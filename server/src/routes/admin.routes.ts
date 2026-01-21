import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/admin.middleware.js";
import { reviewKyc } from "../controllers/admin-kyc.controller.js";

const router = Router();

router.patch("/kyc/:userId", authMiddleware, isAdmin, reviewKyc);

export default router;

