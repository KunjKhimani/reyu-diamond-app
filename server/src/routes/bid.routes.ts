import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createBid, getAllBid, getSellerBid } from "../controllers/bid.controller.js";

const router = Router();

router.post("/:id", protect, createBid);
router.get("/:id/my-bid", protect, getSellerBid);
router.get("/:id", protect, getAllBid);

export default router;