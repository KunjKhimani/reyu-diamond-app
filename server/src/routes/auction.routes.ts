import { Router } from "express";
import { createAuction, getAuctions, getAuction, updateAuction, deleteAuction } from "../controllers/auction.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js";

const router = Router();

router.post("/:inventoryId", protect, kycVerifiedOnly, createAuction);
router.get("/", protect, kycVerifiedOnly, getAuctions);
router.get("/:auctionId", protect, kycVerifiedOnly, getAuction);
router.put("/:auctionId", protect, kycVerifiedOnly, updateAuction);
router.delete("/:auctionId", protect, kycVerifiedOnly, deleteAuction);

export default router;

