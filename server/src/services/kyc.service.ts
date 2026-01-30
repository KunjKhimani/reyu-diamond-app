import mongoose from "mongoose";
import Kyc from "../models/kyc.model.js";
import type { IKyc } from "../models/kyc.model.js";
import User from "../models/User.model.js";
import sendEmail from "../services/email.service.js";
import { sendToAdminTemplate } from "../utils/email.template.js";

export interface SubmitKycInput {
  userId: string;
  aadhaarNumber: string;
  panNumber: string;
  aadhaarImageUrl: string;
  panImageUrl: string;
}

export const findKycByUserId = (userId: string) => {
  return Kyc.findOne({ userId });
};

export const isVerifedService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }
  const user = await User.findById(userId).select("isVerified");
  return user?.isVerified ?? false;
}

export const upsertKycForUser = async ({
  userId,
  aadhaarNumber,
  panNumber,
  aadhaarImageUrl,
  panImageUrl,
}: SubmitKycInput): Promise<IKyc | null> => {
  const kyc = await Kyc.findOneAndUpdate(
    { userId },
    {
      userId,
      aadhaarNumber,
      panNumber,
      aadhaarImageUrl,
      panImageUrl,
      status: "pending",
      rejectionReason: "",
    },
    { upsert: true, new: true }
  );

  return kyc;
};

// Send KYC approval email to all admins for a given userId
export const sendMailToAllAdmins = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("username email");
  if (!user) return;

  const admins = await User.find({ role: "admin" }).select("email");

  await Promise.all(
    admins
    .filter((admin) => !!admin.email)
    .map((admin) =>
      sendEmail({
        to: admin.email,
        subject: "Approval required for new user account",
          //@ts-ignore
          html: sendToAdminTemplate({
            _id: user._id.toString(),
            username: user.username,
            email: user.email
          }),
        })
      )
  );
};
