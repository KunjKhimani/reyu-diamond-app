import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createInventory, getAllInventories, updateInventory, deleteInventory } from "../controllers/inventory.controller.js"

const router = Router();

router.post("/", protect, createInventory);
router.get("/", protect, getAllInventories);
router.put("/:id", protect, updateInventory);
router.delete("/:id", protect, deleteInventory);

export default router;