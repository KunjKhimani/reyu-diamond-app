import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createInventory, getAllInventories, updateInventory, deleteInventory, getInventoryById } from "../controllers/inventory.controller.js"
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js"

const router = Router();

router.post("/", protect, kycVerifiedOnly, createInventory);
router.get("/", getAllInventories);
router.get("/:id", protect, kycVerifiedOnly, getInventoryById);
router.put("/:id", protect, kycVerifiedOnly, updateInventory);
router.delete("/:id", protect, kycVerifiedOnly, deleteInventory);

export default router;