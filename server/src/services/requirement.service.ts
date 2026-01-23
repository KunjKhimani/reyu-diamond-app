import mongoose from "mongoose";
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
  userId: string,
  requirementId: string,
  updateData: Partial<IRequirement>
): Promise<IRequirement> => {

  if (!mongoose.Types.ObjectId.isValid(requirementId)) {
    throw {
      statusCode: 400,
      message: "Invalid inventory id",
    };
  }

  const requirement = await Requirement.findOneAndUpdate(
    { 
      _id: requirementId, 
      status: "active", 
      buyerId: userId
    },
    {
      $set: updateData,
    },
    { new: true }
  );

  if (!requirement) {
    throw new Error("Requirement not found or not active");
  }

  if (!requirement) {
    const exists = await Requirement.exists({ _id: requirementId });
    
    if (!exists) {
        throw {
            statusCode: 404,
            message: "Requirement not found",
        };
    }
    
    throw {
        statusCode: 403,
        message: "You are not authorized to delete this Requirement or it is not active",
    };
  }

  return requirement;
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