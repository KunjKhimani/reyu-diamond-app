import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createBid, getAllBid, getSellerBid, updateBidStatus } from "../controllers/bid.controller.js";

const router = Router();

router.post("/:requirementId", protect, createBid);
router.get("/:requirementId/my-bid", protect, getSellerBid);
router.get("/:requirementId", protect, getAllBid);
router.patch("/:bidId/status", protect, updateBidStatus);

export default router;