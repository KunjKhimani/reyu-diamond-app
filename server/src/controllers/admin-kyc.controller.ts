import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import { reviewKycService } from "../services/kyc-admin.service.js";

export const reviewKyc = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body as {
      status?: "approved" | "rejected" | "pending";
      rejectionReason?: string;
    };

    if (!userId || typeof userId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid status",
      });
    }

    await reviewKycService({
      userId,
      status,
      ...(rejectionReason !== undefined ? { rejectionReason } : {}),
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `KYC ${status} successfully`,
    });
  } catch (error: any) {
    return sendResponse({
      res,
      statusCode: error?.message === "KYC record not found" ? 404 : 500,
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

