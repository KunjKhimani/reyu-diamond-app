import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { notifyAdminsForKyc } from "../services/notification.service.js";
import {
  upsertKycForUser,
  sendMailToAllAdmins,
} from "../services/kyc.service.js";

export const submitKyc = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Not authorized",
      });
    }

    const { aadhaarNumber, panNumber } = (req.body ?? {}) as {
      aadhaarNumber?: string;
      panNumber?: string;
    };

    // // Prevent duplicate KYC creation – user must use PUT to update
    // const existingKyc = await findKycByUserId(userId);
    // if (existingKyc) {
    //   return sendResponse({
    //     res,
    //     statusCode: 409,
    //     success: false,
    //     message: "KYC already submitted. Use PUT /api/kyc/submit to update.",
    //   });
    // }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const aadhaarFile = files?.["aadhaar"]?.[0];
    const panFile = files?.["pan"]?.[0];

    if (!aadhaarNumber || !panNumber) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Aadhaar number and PAN number are required",
      });
    }

    console.log()
    if (!aadhaarFile || !panFile) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Aadhaar and PAN documents are required",
      });
    }

    const aadhaarUrl = await uploadToCloudinary( aadhaarFile, "kyc/aadhaar");
    const panUrl = await uploadToCloudinary(panFile, "kyc/pan");

    await upsertKycForUser({
      userId,
      aadhaarNumber,
      panNumber,
      aadhaarImageUrl: aadhaarUrl,
      panImageUrl: panUrl,
    });

    await notifyAdminsForKyc(userId);
    await sendMailToAllAdmins(userId);
    
    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "KYC submitted successfully. Awaiting admin approval.",
    });
  } catch (err: any) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to submit KYC",
      errors: err?.message ?? "Something went wrong",
    });
  }
};
