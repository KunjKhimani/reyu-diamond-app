import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  createRequirement,
  getMyRequirement,
  getAllRequirements,
  updateRequirements,
  getRequirementById,
  deleteRequirement,
} from "../controllers/requirement.controller.js";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware.js";

const router = Router();

router.post("/", protect, kycVerifiedOnly, createRequirement);
router.put("/:id", protect, kycVerifiedOnly, updateRequirements);
router.get("/", protect, kycVerifiedOnly, getAllRequirements);
router.get("/my-requirement", protect, kycVerifiedOnly, getMyRequirement);
// router.get("/:id", protect, kycVerifiedOnly, getRequirementById);
router.delete("/:id", protect, kycVerifiedOnly, deleteRequirement);

export default router;