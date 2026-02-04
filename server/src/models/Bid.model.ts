import mongoose, { Document, Model } from "mongoose";

export type BidStatus =
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;

  bidAmount: number;

  status: BidStatus;
  isHighestBid: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new mongoose.Schema<IBid>(
  {
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

    bidAmount: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "ACCEPTED", "REJECTED", "EXPIRED"],
      default: "SUBMITTED",
      index: true,
    },

    // Ensures only one highest bid per inventory
    isHighestBid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔒 Only ONE highest bid allowed per inventory
bidSchema.index(
  { auctionId: 1, isHighestBid: 1 },
  {
    unique: true,
    partialFilterExpression: { isHighestBid: true },
  }
);

// 🚫 Prevent same buyer placing same bid again
bidSchema.index(
  { auctionId: 1, buyerId: 1, bidAmount: 1 },
  { unique: true }
);

const Bid: Model<IBid> = mongoose.model<IBid>("Bid", bidSchema);

export default Bid;
