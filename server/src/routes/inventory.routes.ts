import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createInventory, getAllInventories, updateInventory, deleteInventory, getInventoryById } from "../controllers/inventory.controller.js"

const router = Router();

router.post("/", protect, createInventory);
router.get("/", getAllInventories);
router.get("/:id", protect, getInventoryById);
router.put("/:id", protect, updateInventory);
router.delete("/:id", protect, deleteInventory);

export default router;