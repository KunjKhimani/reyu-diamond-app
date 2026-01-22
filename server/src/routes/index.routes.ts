import { Router } from "express";
import authRoutes from "./auth.routes.js";
import kycRoutes from "./kyc.routes.js";
import adminRoutes from "./admin.routes.js";
import emailRoutes from "./email.routes.js";
import requirementRoutes from "./requirement.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/kyc", kycRoutes);
router.use("/admin", adminRoutes);
router.use("/email", emailRoutes);
router.use("/requirements", requirementRoutes);

export default router;
