import type { IRequirement } from "../models/requirement.model.js";
import Requirement from "../models/requirement.model.js";

export const createRequirementService = async (userId: string, requirementData: any): Promise<IRequirement> => {
    const newRequirement = {
        buyerId: userId,
        ...requirementData,
        createdAt: new Date(),
    };
    const requirement = await Requirement.create(newRequirement);
    return requirement;
};

export const getAllRequirementsService = async (): Promise<IRequirement[]> => {
    const requirements = await Requirement.find().exec();
    return requirements;
}

export const updateDataService = async (
  requirementId: string,
  updateData: Partial<IRequirement>
): Promise<IRequirement> => {
  const updated = await Requirement.findOneAndUpdate(
    { _id: requirementId, status: "active" },
    updateData,
    { new: true }
  );

  if (!updated) {
    throw new Error("Requirement not found or not active");
  }

  return updated;
};

export const getRequirementByIdService = async (
  requirementId: string
): Promise<IRequirement | null> => {
  const requirement = await Requirement.findById(requirementId).exec();
  return requirement;
}

export const deleteRequirementService = async (
  requirementId: string
): Promise<void> => {
  await Requirement.findByIdAndDelete(requirementId).exec();
}