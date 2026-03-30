import mongoose from "mongoose";
import KYC from "../models/kyc.model.js";
import type { IKyc } from "../models/kyc.model.js";
import User from "../models/User.model.js";
import { addEmailJob } from "../queues/email.queue.js";
import { sendToAdminTemplate } from "../utils/email.template.js";

export interface SubmitKycInput {
  userId: string;
  firstName: string;
  middleName?: string | undefined;
  lastName: string;
  dob: Date;
  phone: string;
  address: {
    residentialAddress: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  aadhaar: {
    aadhaarHash: string;
    aadhaarNumber: string;
    url: string;
    publicId: string;
  };
  pan: {
    panHash: string;
    panNumber: string;
    url: string;
    publicId: string;
  };
}

export const findKycByUserId = (userId: string) => {
  return KYC.findOne({ userId });
};

export const isVerifedService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }
  const user = await User.findById(userId).select("isVerified");
  return user?.isVerified ?? false;
};

export const upsertKycForUser = async (
  input: SubmitKycInput
): Promise<IKyc | null> => {
  const { userId, ...kycData } = input;

  const kyc = await KYC.findOneAndUpdate(
    { userId },
    {
      userId,
      ...kycData,
      documents: {
        aadhaar: input.aadhaar,
        pan: input.pan,
      },
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
        addEmailJob({
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
