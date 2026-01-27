import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createBid, getAllBid, getSellerBid, updateBidStatus } from "../controllers/bid.controller.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js"

const router = Router();

router.post("/:inventoryId", protect, kycVerifiedOnly, createBid);
router.get("/:inventoryId", protect, kycVerifiedOnly, getAllBid);
router.get("/:inventoryId/my-bid", protect, kycVerifiedOnly, getSellerBid);
router.patch("/:bidId/status", protect, kycVerifiedOnly, updateBidStatus);

export default router;