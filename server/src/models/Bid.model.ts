import mongoose, { Document, Model } from "mongoose";

export type BidStatus =
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface IBid extends Document {
  requirementId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  // Offered diamond (can be inventory-linked or free offer)
  inventoryId?: mongoose.Types.ObjectId;

  offeredShape: string;
  offeredCarat: number;
  offeredColor: string;
  offeredClarity: string;
  offeredLab: string;

  price: number;
  deliveryDays: number;

  status: BidStatus;

  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new mongoose.Schema<IBid>(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
      index: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },

    // never rely only on inventory
    offeredShape: { type: String, required: true },
    offeredCarat: { type: Number, required: true },
    offeredColor: { type: String, required: true },
    offeredClarity: { type: String, required: true },
    offeredLab: { type: String, required: true },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "ACCEPTED", "REJECTED", "EXPIRED"],
      default: "SUBMITTED",
    },
  },
  { timestamps: true }
);

// One seller → one active bid per requirement
bidSchema.index(
  {
    requirementId: 1,
    sellerId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { status: "SUBMITTED" },
  }
);

const Bid: Model<IBid> = mongoose.model<IBid>("Bid", bidSchema);

export default Bid;
