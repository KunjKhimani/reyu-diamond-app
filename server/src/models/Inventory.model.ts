import mongoose, { Document, Model } from "mongoose";

export type InventoryStatus = "AVAILABLE" | "NOT_AVAILABLE" | "LISTED" | "SOLD" | "ON_MEMO";

export interface IInventory extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  barcode: string;

  carat: number;
  cut: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "FAIR" | "POOR";
  color: "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";
  clarity: "FL" | "IF" | "VVS1" | "VVS2" | "VS1" | "VS2" | "SI1" | "SI2" | "I1";
  shape:
  | "ROUND"
  | "PRINCESS"
  | "CUSHION"
  | "EMERALD"
  | "OVAL"
  | "RADIANT"
  | "ASSCHER"
  | "MARQUISE"
  | "HEART"
  | "PEAR";

  lab: string;
  location: string;
  price: number;
  currency: string;

  status: InventoryStatus;
  locked: boolean;
  images: string[];
  video?: string;
}

const inventorySchema = new mongoose.Schema<IInventory>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    carat: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100,
    },

    cut: {
      type: String,
      enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"],
      required: true,
    },

    color: {
      type: String,
      enum: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
      required: true,
    },

    clarity: {
      type: String,
      enum: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"],
      required: true,
    },

    shape: {
      type: String,
      enum: [
        "ROUND",
        "PRINCESS",
        "CUSHION",
        "EMERALD",
        "OVAL",
        "RADIANT",
        "ASSCHER",
        "MARQUISE",
        "HEART",
        "PEAR",
      ],
      required: true,
    },

    lab: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      required: true,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "NOT_AVAILABLE", "LISTED", "SOLD", "ON_MEMO"],
      default: "AVAILABLE",
    },

    locked: {
      type: Boolean,
      default: false,
    },

    images: {
      type: [String],
      default: [],
    },

    video: {
      type: String,
    },
  },
  { timestamps: true }
);

const Inventory: Model<IInventory> = mongoose.model<IInventory>(
  "Inventory",
  inventorySchema
);

export default Inventory;