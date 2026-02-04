import type { Request, Response, NextFunction } from "express";
import User from "../models/User.model.js";
import Kyc from "../models/kyc.model.js";
import sendResponse from "../utils/api.response.js";

export const kycVerifiedOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);

    if (user?.role === "admin") {
      return next();
    }

    const kycDoc = await Kyc.findOne({ userId, status: "approved" });

    if (!kycDoc) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "KYC approval required",
      });
    }

    next();
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to verify KYC",
      errors: (err as Error)?.message ?? "Something went wrong",
    });
  }
};