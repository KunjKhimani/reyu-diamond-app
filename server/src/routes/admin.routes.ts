import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { reviewKyc, getAllKyc } from "../controllers/admin-kyc.controller.js";
import { updateUserStatus, getUsers, getActionBidsByUserId, getAllBidsOfUser, getAllRatingsAndBadges } from "../controllers/admin-user.controller.js";
import isAdmin from "../middlewares/admin.middleware.js";


const router = Router();
router.use(authMiddleware, isAdmin);

// dashboard routes moved to server.ts

// kyc routes
router.patch("/kyc/:userId", reviewKyc);
router.get("/kycs", getAllKyc);

// user routes
router.patch("/users/:userId/status", updateUserStatus);
router.get("/users", getUsers);

// bid routes
router.get("/bids/:auctionId/:userId", getActionBidsByUserId);
router.get("/bids/:userId", getAllBidsOfUser);

// rating and badges
router.get("/ratings-and-badges", getAllRatingsAndBadges);

export default router;

