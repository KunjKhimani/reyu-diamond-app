import mongoose from "mongoose";
import type { IRequirement } from "../models/requirement.model.js";
import Requirement from "../models/requirement.model.js";

/** Create or update the requirement for the user (one per user). First call creates, subsequent calls update. */
export const createOrUpdateRequirementService = async (
  userId: string,
  requirementData: Partial<Pick<IRequirement, "shape" | "carat" | "color" | "clarity" | "lab" | "location" | "budget">>
): Promise<IRequirement> => {
  const doc = await Requirement.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { userId: new mongoose.Types.ObjectId(userId), ...requirementData } },
    { upsert: true, new: true, runValidators: true }
  );
  return doc;
};

export const getAllRequirementsService = async (): Promise<IRequirement[]> => {
  const requirements = await Requirement.find().exec();
  return requirements;
}

export const updateRequirementByIdService = async (
  userId: string,
  requirementId: string,
  updateData: Partial<Pick<IRequirement, "shape" | "carat" | "color" | "clarity" | "lab" | "location" | "budget">>
): Promise<IRequirement> => {
  if (!mongoose.Types.ObjectId.isValid(requirementId)) {
    throw new Error("Invalid requirement id");
  }

  const requirement = await Requirement.findOneAndUpdate(
    { _id: requirementId, userId: new mongoose.Types.ObjectId(userId) },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!requirement) {
    const exists = await Requirement.exists({ _id: requirementId });
    if (!exists) throw new Error("Requirement not found");
    throw new Error("You are not authorized to update this requirement");
  }

  return requirement;
};

export const getRequirementByIdService = async (
  requirementId: string
): Promise<IRequirement | null> => {
  const requirement = await Requirement.findById(requirementId).exec();
  return requirement;
};

/** Get the current user's requirement (at most one per user). */
export const getMyRequirementService = async (userId: string): Promise<IRequirement | null> => {
  const requirement = await Requirement.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  return requirement;
};

export const deleteRequirementService = async (
  requirementId: string
): Promise<void> => {
  await Requirement.findByIdAndDelete(requirementId).exec();
}