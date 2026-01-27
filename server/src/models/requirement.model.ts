import mongoose, { Document, Model } from "mongoose";

export interface IRequirement extends Document {
  userId: mongoose.Types.ObjectId;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  location: string;
  budget: number;
  createdAt: Date;
  updatedAt: Date;
}

const requirementSchema = new mongoose.Schema<IRequirement>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
  },
  { timestamps: true }
);

requirementSchema.index(
  { userId: 1 },
  { unique: true }
);

const Requirement: Model<IRequirement> =
  mongoose.model<IRequirement>("Requirement", requirementSchema);

export default Requirement;
