import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { register, login, logout, verifyOtp, getProfile, upadteUserProfile } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/verify-otp", verifyOtp);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, upadteUserProfile);

export default router;