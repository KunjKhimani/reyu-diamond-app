import { Router } from "express";
import authRoutes from "./auth.routes.js";
import kycRoutes from "./kyc.routes.js";
import adminRoutes from "./admin.routes.js";
import emailRoutes from "./email.routes.js";
import requirementRoutes from "./requirement.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import bidRoutes from "./bid.routes.js";
import dealRoutes from "./deal.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/kyc", kycRoutes);
router.use("/admin", adminRoutes);
router.use("/email", emailRoutes);
router.use("/requirements", requirementRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/bid", bidRoutes);
router.use("/deal", dealRoutes);

export default router;
