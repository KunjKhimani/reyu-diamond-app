import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js";
import { dealCreation, dealDetailsById, getAllBids, updateDealStatus, downloadPDF } from "../controllers/deal.controller.js";
import { loadUserRole } from "../middlewares/permission.middleware.js";
import { canAccessDeal } from "../middlewares/canAccessDeal.middleware.js";

const router = Router();

router.post("/:bidId", protect, kycVerifiedOnly, dealCreation);
router.get(
    "/:dealId", 
    protect, 
    kycVerifiedOnly, 
    loadUserRole, 
    dealDetailsById
);
router.get(
  "/",
  protect,
  kycVerifiedOnly,
  loadUserRole,
  getAllBids
);
router.patch(
  "/:dealId",
  protect,
  kycVerifiedOnly,
  loadUserRole,
  canAccessDeal,
  updateDealStatus
);
router.post(
  "/:dealId/pdf",
  protect,
  kycVerifiedOnly,
  loadUserRole,
  canAccessDeal,
  downloadPDF
);

export default router;
