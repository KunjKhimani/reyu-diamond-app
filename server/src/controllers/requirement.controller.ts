import type { Request, Response } from "express";
import {
  createOrUpdateRequirementService,
  getAllRequirementsService,
  updateRequirementByIdService,
  getRequirementByIdService,
  getMyRequirementService,
  deleteRequirementService,
} from "../services/requirement.service.js";
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

    const { shape, carat, color, clarity, lab, location, budget } = req.body;

    if (!shape || carat == null || !color || !clarity || !lab || !location || budget == null) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "shape, carat, color, clarity, lab, location and budget are required",
      });
    }

    const requirement = await createOrUpdateRequirementService(userId, {
      shape,
      carat,
      color,
      clarity,
      lab,
      location,
      budget,
    });

    const isNew = requirement.createdAt && requirement.updatedAt
      && requirement.createdAt.getTime() === requirement.updatedAt.getTime();

    return sendResponse({
      res,
      statusCode: isNew ? 201 : 200,
      success: true,
      data: requirement,
      message: isNew ? "Requirement created successfully" : "Requirement updated successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to save requirement",
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

    const updatedRequirement = await updateRequirementByIdService(userId, requirementId, updateData);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: updatedRequirement,
      message: "Requirement updated successfully",
    });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg === "Invalid requirement id") {
      return sendResponse({ res, statusCode: 400, success: false, message: msg });
    }
    if (msg === "Requirement not found") {
      return sendResponse({ res, statusCode: 404, success: false, message: msg });
    }
    if (msg?.includes("not authorized")) {
      return sendResponse({ res, statusCode: 403, success: false, message: msg });
    }
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update requirement",
      errors: msg || "Something went wrong",
    });
  }
};

export const getMyRequirement = async (req: Request, res: Response) => {
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

    const requirement = await getMyRequirementService(userId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: requirement,
      message: requirement
        ? "Requirement fetched successfully"
        : "No requirement found. Create one with POST /.",
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