import mongoose, { Document, Model } from "mongoose";

export type InventoryStatus = "AVAILABLE" | "NOT_AVAILABLE" | "LISTED" | "SOLD" | "ON_MEMO";
export type UploadStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";


export interface IInventory extends Document {
  sellerId: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  barcode: string;

  carat?: number;
  cut?: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "FAIR" | "POOR";
  color?: "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";
  clarity?: "FL" | "IF" | "VVS1" | "VVS2" | "VS1" | "VS2" | "SI1" | "SI2" | "I1";
  shape?:
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

  lab?: string;
  location?: string;
  price?: number;
  currency?: string;

  status: InventoryStatus;
  uploadStatus: UploadStatus;
  locked: boolean;
  images: string[];
  video?: string;

  // Bulk Process Fields
  isBulkHeader: boolean;
  bulkId?: string;
  bulkMetadata?: {
    fileName: string;
    totalItems: number;
    processedCount: number;
    successCount: number;
    failureCount: number;
    errors: Array<{ row: number; error: string }>;
  };
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
      min: 0.01,
      max: 100,
    },

    cut: {
      type: String,
      enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"],
    },

    color: {
      type: String,
      enum: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
    },

    clarity: {
      type: String,
      enum: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"],
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
    },

    lab: {
      type: String,
    },

    location: {
      type: String,
    },

    price: {
      type: Number,
    },

    currency: {
      type: String,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "NOT_AVAILABLE", "LISTED", "SOLD", "ON_MEMO"],
      default: "AVAILABLE",
    },
    uploadStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
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

    // Bulk Fields Implementation
    isBulkHeader: {
      type: Boolean,
      default: false,
    },
    bulkId: {
      type: String,
      index: true,
    },
    bulkMetadata: {
      fileName: String,
      totalItems: { type: Number, default: 0 },
      processedCount: { type: Number, default: 0 },
      successCount: { type: Number, default: 0 },
      failureCount: { type: Number, default: 0 },
      errors: [
        {
          row: Number,
          error: String,
        },
      ],
    },
  },
  { timestamps: true }
);

const Inventory: Model<IInventory> = mongoose.model<IInventory>(
  "Inventory",
  inventorySchema
);

export default Inventory;