import mongoose from "mongoose";

const inventoryStatusLogSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    fromStatus: String,
    toStatus: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "InventoryStatusLog",
  inventoryStatusLogSchema
);
