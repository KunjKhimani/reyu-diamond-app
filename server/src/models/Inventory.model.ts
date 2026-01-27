import mongoose, { Document, Model } from "mongoose";

export type InventoryStatus = "IN_LOCKER" | "ON_MEMO" | "SOLD";

export interface IInventory extends Document {
  sellerId: mongoose.Types.ObjectId;
  barcode: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  location: string;
  basePrice: number;
  currentBiddingPrice: number;
  status: InventoryStatus;
  locked: boolean;
}

const inventorySchema = new mongoose.Schema<IInventory>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    shape: String,
    carat: Number,
    color: String,
    clarity: String,
    lab: String,
    location: String,

    basePrice: {
      type: Number,
      required: true,
    },

    currentBiddingPrice: Number,

    status: {
      type: String,
      enum: ["IN_LOCKER", "ON_MEMO", "SOLD"],
      default: "IN_LOCKER",
    },

    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

inventorySchema.index(
  {
    sellerId: 1,
    shape: 1,
    carat: 1,
    color: 1,
    clarity: 1,
    lab: 1,
    location: 1,
    basePrice: 1,
  },
  { unique: true }
);

const Inventory: Model<IInventory> =
  mongoose.model<IInventory>("Inventory", inventorySchema);

export default Inventory;
