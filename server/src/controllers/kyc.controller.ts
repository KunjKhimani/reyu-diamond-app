import type { Request, Response, NextFunction } from "express";
import sendResponse from "../utils/api.response.js";
import { sendDelayedEmail } from "../utils/delayedMailer.js";
import User from "../models/User.model.js";
import { uploadToCloudinaryDetails } from "../services/cloudinary.service.js";
import { notifyAdminsForKyc } from "../services/notification.service.js";
import {
  upsertKycForUser,
  sendMailToAllAdmins,
  isVerifedService
} from "../services/kyc.service.js";

import crypto from "crypto";

export const submitKyc = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      const err: any = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const otpVerified = await isVerifedService(userId);

    if (!otpVerified) {
      const err: any = new Error("Your e-mail is not verified");
      err.statusCode = 400;
      throw err;
    }

    const {
      firstName,
      middleName,
      lastName,
      dob,
      phone,
      address,
      documents
    } = req.body as {
      firstName: string;
      middleName?: string;
      lastName: string;
      dob: string;
      phone: string;
      address: {
        residentialAddress: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
      };
      documents: {
        aadhaar: { aadhaarNumber: string };
        pan: { panNumber: string };
      };
    };

    const { residentialAddress, city, state, pincode, country } = address;
    const { aadhaarNumber } = documents.aadhaar;
    const { panNumber } = documents.pan;

    const files = req.files as Express.Multer.File[];

    // Find files by fieldname (partial match to accept various nesting)
    const aadhaarFile = files?.find(f => f.fieldname.includes("aadhaar"));
    const panFile = files?.find(f => f.fieldname.includes("pan"));

    if (!aadhaarFile || !panFile) {
      const err: any = new Error("Aadhaar and PAN documents are required");
      err.statusCode = 400;
      throw err;
    }

    // Helper for hashing
    const hashValue = (value: string) =>
      crypto.createHash("sha256").update(value).digest("hex");

    // Upload documents and get public_id
    const aadhaarUpload = await uploadToCloudinaryDetails(
      aadhaarFile,
      "kyc/aadhaar"
    );
    const panUpload = await uploadToCloudinaryDetails(panFile, "kyc/pan");

    await upsertKycForUser({
      userId,
      firstName,
      middleName,
      lastName,
      dob: new Date(dob),
      phone,
      address: {
        residentialAddress,
        city,
        state,
        pincode,
        country: country || "IN",
      },
      aadhaar: {
        aadhaarHash: hashValue(aadhaarNumber),
        aadhaarNumber,
        url: aadhaarUpload.secure_url,
        publicId: aadhaarUpload.public_id,
      },
      pan: {
        panHash: hashValue(panNumber),
        panNumber,
        url: panUpload.secure_url,
        publicId: panUpload.public_id,
      },
    });

    await notifyAdminsForKyc(userId);
    const user = await User.findById(userId);

    if (user) {
      // Send delayed email after 3 minutes for Cloudinary upload step
      await sendDelayedEmail({
        to: user.email,
        subject: "KYC Documents Received",
        html: `<h1>Hello, ${user.username}!</h1><p>We have successfully received your KYC documents. This is a confirmation sent 3 minutes after your upload.</p>`
      }, 3);
    }

    await sendMailToAllAdmins(userId);

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "KYC submitted successfully. Awaiting admin approval.",
    });
  } catch (err: any) {
    next(err);
  }
};
