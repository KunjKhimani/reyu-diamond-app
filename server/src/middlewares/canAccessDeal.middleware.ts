import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Deal, { type IDeal } from "../models/Deal.model.js";
import sendResponse from "../utils/api.response.js";

interface DealRequest extends Request {
  user?: { _id?: unknown; id?: string };
  userRole?: "user" | "admin";
  deal?: IDeal;
}

export const canAccessDeal = async (
  req: DealRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dealId = Array.isArray(req.params?.dealId) ? req.params.dealId[0] : req.params?.dealId;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return sendResponse({ res, statusCode: 400, success: false, message: "Invalid deal id" });
    }

    const deal = await Deal.findById(dealId).select("buyerId sellerId");
    console.log("Fetched deal for access check:", deal);
    if (!deal) {
      return sendResponse({ res, statusCode: 404, success: false, message: "Deal not found" });
    }

    const userId = (req.user?.id ?? (req.user?._id != null ? String(req.user._id) : ""));
    const role = req.userRole;
    if (!userId || !role) {
      return sendResponse({ res, statusCode: 401, success: false, message: "Unauthorized" });
    }

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {  
      return sendResponse({ res, statusCode: 403, success: false, message: "Access denied" });
    }

    // Attach deal to req for downstream controllers
    req.deal = deal;

    next();
  } catch (error) {
    console.error("Deal access error:", error);
    return sendResponse({ res, statusCode: 500, success: false, message: "Authorization failed" });
  }
};