import mongoose, { Document, Model } from "mongoose";

export type KYCStatus = "pending" | "approved" | "rejected";

export interface IKyc extends Document {
  userId: mongoose.Types.ObjectId;
  aadhaarNumber: string;
  panNumber: string;
  aadhaarImageUrl: string;
  panImageUrl: string;
  status: KYCStatus;
  rejectionReason?: string;
}

const kycSchema = new mongoose.Schema<IKyc>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    aadhaarImageUrl: {
      type: String,
      required: true,
    },

    panImageUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: null,
    },
  },{ timestamps: true,}
);

const Kyc: Model<IKyc> = mongoose.model<IKyc>("Kyc", kycSchema);

export default Kyc;