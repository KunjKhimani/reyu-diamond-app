import mongoose, { Document, Model } from "mongoose";

export type RequirementStatus = "active" | "closed" | "expired";

export interface IRequirement extends Document {
  buyerId: mongoose.Types.ObjectId;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  location: string;
  budget: number;
  deadline: Date;
  status: RequirementStatus;
  createdAt: Date;
  updatedAt: Date;
}

const requirementSchema = new mongoose.Schema<IRequirement>(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shape: {
      type: String,
      required: true,
      trim: true,
    },

    carat: {
      type: Number,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    clarity: {
      type: String,
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

    budget: {
      type: Number,
      required: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "closed", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

requirementSchema.index(
  {
    buyerId: 1,
    shape: 1,
    carat: 1,
    color: 1,
    clarity: 1,
    lab: 1,
  },
  { unique: true }
);

const Requirement: Model<IRequirement> =
  mongoose.model<IRequirement>("Requirement", requirementSchema);

export default Requirement;
