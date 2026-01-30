import type { Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import sendResponse from "../utils/api.response.js";

export const loadUserRole = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id as string | undefined;

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("role");

    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to load user role",
      errors: (error as Error).message ?? "Something went wrong",
    });
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: any, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Access denied",
      });
    }
    next();
  };

export const ownerOrAdmin = (
  model: mongoose.Model<any>,
  ownerField: string,
  paramKey: string = "id"
) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string | undefined;
      const role = req.userRole as string | undefined;

      if (!userId) {
        return sendResponse({
          res,
          statusCode: 401,
          success: false,
          message: "Unauthorized",
        });
      }

      // Admin bypass
      if (role === "admin") {
        return next();
      }

      const resourceId = req.params?.[paramKey] as string | undefined;

      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Invalid resource identifier",
        });
      }

      const resource = await model
        .findById(resourceId)
        .select(ownerField)
        .lean();

      if (!resource) {
        return sendResponse({
          res,
          statusCode: 404,
          success: false,
          message: "Resource not found",
        });
      }

      const ownerId = resource[ownerField];
      if (!ownerId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "Ownership not defined",
        });
      }

      if (ownerId.toString() !== userId) {
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "You are not allowed to access this resource",
        });
      }

      next();
    } catch (error) {
      return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Authorization failed",
        errors: (error as Error).message ?? "Something went wrong",
      });
    }
  };
};

