import mongoose, { Document, Model } from "mongoose";

export type DealStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "IN_ESCROW"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export interface IDeal extends Document {
  bidId: mongoose.Types.ObjectId;
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  agreedAmount: number;
  currency: string;
  status: DealStatus;

  payment: {
    isPaid: boolean;
    paidAt?: Date;
    method?: string;
    transactionId?: string;
  };

  shipping?: {
    courier?: string;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  };

  dispute?: {
    reason: string;
    raisedBy: mongoose.Types.ObjectId;
    raisedAt: Date;
    resolvedAt?: Date;
    resolution?: string;
  };

  history: {
    status: DealStatus;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
  }[];

  pdfPath?: string;

  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new mongoose.Schema<IDeal>(
  {
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
      unique: true,
      index: true,
    },

    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    agreedAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: [
        "CREATED",
        "PAYMENT_PENDING",
        "IN_ESCROW",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ],
      default: "CREATED",
      index: true,
    },

    payment: {
      isPaid: { type: Boolean, default: false },
      paidAt: Date,
      method: String,
      transactionId: String,
    },

    shipping: {
      courier: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },

    dispute: {
      reason: String,
      raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      raisedAt: Date,
      resolvedAt: Date,
      resolution: String,
    },

    history: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    pdfPath: String,
  },
  { timestamps: true }
);

const Deal: Model<IDeal> = mongoose.model<IDeal>("Deal", dealSchema);

export default Deal;
