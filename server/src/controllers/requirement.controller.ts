import type { Request, Response } from "express";
import { createRequirementService, getAllRequirementsService, updateDataService, getRequirementByIdService, deleteRequirementService } from "../services/requirement.service.js";
import sendResponse from "../utils/api.response.js";

export const createRequirement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const requirement = await createRequirementService(userId, req.body);
    return sendResponse({
        res,
        statusCode: 201,
        success: true,
        data: requirement,
        message: "Requirement created successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to create requirement",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};

export const getAllRequirements = async (req: Request, res: Response) => {
  try {
    const requirements = await getAllRequirementsService();
    return sendResponse({
        res,
        statusCode: 200,
        success: true,
        data: requirements,
        message: "All Requirements fetched successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to fetch requirements",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};

export const updateRequirements = async (req: Request, res: Response) => {
  try{
    const userId = (req as any).user?.id as string | undefined;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "User ID is required",
      });
    }

    const requirementId = req.params.id as string;
    const updateData = req.body;

    if (!requirementId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Requirement ID is required",
      });
    }

    const updatedRequirement = await updateDataService(userId, requirementId, updateData);
    
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: updatedRequirement,
      message: "Requirement updated successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to update requirements",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};

export const getRequirementById = async (req: Request, res: Response) => {
  try {
    const requirementId = req.params.id as string;
    if (!requirementId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Requirement ID is required",
      });
    }
    const requirement = await getRequirementByIdService(requirementId);
    return sendResponse({
        res,
        statusCode: 200,
        success: true,
        data: requirement,
        message: "Requirement fetched successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to fetch requirement",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};

export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const requirementId = req.params.id as string;
    if (!requirementId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Requirement ID is required",
      });
    } 

    const dlt = await deleteRequirementService(requirementId);

    return sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: "Requirement deleted successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to delete requirement",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};