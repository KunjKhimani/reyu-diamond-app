import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  createInventory,
  getAllInventories,
  updateInventory,
  deleteInventory,
  getInventoryById,
} from "../controllers/inventory.controller.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js";
import { loadUserRole, ownerOrAdmin } from "../middlewares/permission.middleware.js";
import Inventory from "../models/Inventory.model.js";

const router = Router();

router.post("/", protect, kycVerifiedOnly, createInventory);
router.get("/", getAllInventories);
router.get("/:id", getInventoryById);
router.put( 
  "/:id", 
  protect, 
  kycVerifiedOnly, 
  loadUserRole, 
  // ownerOrAdmin(Inventory, "sellerId", "id"), 
  updateInventory
);
router.delete( 
  "/:id", 
  protect, 
  kycVerifiedOnly, 
  loadUserRole, 
  ownerOrAdmin(Inventory, "sellerId", "id"), 
  deleteInventory
);

export default router;