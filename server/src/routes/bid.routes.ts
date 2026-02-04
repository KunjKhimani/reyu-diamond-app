import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  createBid,
  getAllBid,
  getSellerBid,
  updateBidStatus,
} from "../controllers/bid.controller.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js";
import { loadUserRole, ownerOrAdmin } from "../middlewares/permission.middleware.js";
import Inventory from "../models/Inventory.model.js";

const router = Router();

router.post("/:auctionId", protect, kycVerifiedOnly, createBid);
router.get(
  "/:auctionId",
  protect,
  kycVerifiedOnly,
  loadUserRole,
  getAllBid
);
router.get("/:auctionId/my-bid", protect, kycVerifiedOnly, getSellerBid);
router.patch("/:bidId/status", protect, kycVerifiedOnly, loadUserRole, updateBidStatus);

export default router;