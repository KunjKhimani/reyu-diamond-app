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
import { loadUserRole, ownerOrAdmin, requireRole } from "../middlewares/permission.middleware.js";
import Requirement from "../models/requirement.model.js";

const router = Router();

router.post("/", protect, kycVerifiedOnly, createRequirement);
router.put( 
  "/:id", 
  protect, 
  kycVerifiedOnly, 
  loadUserRole, 
  // ownerOrAdmin(Requirement, "userId", "id"), 
  updateRequirements
);
router.get("/", protect, kycVerifiedOnly, loadUserRole, requireRole("admin"), getAllRequirements);
router.get("/my-requirement", protect, kycVerifiedOnly, getMyRequirement);
// router.get("/:id", protect, kycVerifiedOnly, getRequirementById);
router.delete(
  "/:id", 
  protect, 
  kycVerifiedOnly, 
  loadUserRole, 
  // ownerOrAdmin(Requirement, "userId", "id"), 
  deleteRequirement
);

export default router;