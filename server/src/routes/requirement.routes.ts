import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { createRequirement, getAllRequirements, updateRequirements, getRequirementById, deleteRequirement } from "../controllers/requirement.controller.js";

const router = Router();

router.post("/", protect, createRequirement);
router.get("/", protect, getAllRequirements);
router.put("/:id", protect, updateRequirements);
router.get("/:id", protect, getRequirementById);
router.delete("/:id", protect, deleteRequirement);

export default router;