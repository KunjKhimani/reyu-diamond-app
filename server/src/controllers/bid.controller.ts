import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import { placeBid, getAllBidsByRequirement, getSellerService, updateBidStatusService } from "../services/bid.service.js";
import User from "../models/User.model.js";

export const createBid = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user?.id as string | undefined;
    const requirementId = req.params.id as string;
    
    if (!sellerId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }
    
    const bid = await placeBid(requirementId, sellerId, req.body);
    
    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error: any) {
    switch (error.message) {
      case "REQUIREMENT_NOT_FOUND":
        return sendResponse({
          res,
          statusCode: 404,
          success: false,
          message: "Requirement not found",
        });

      case "REQUIREMENT_NOT_ACTIVE":
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Requirement is not active",
        });

      case "CANNOT_BID_OWN_REQUIREMENT":
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "You cannot bid on your own requirement",
        });

      case "NOT_OWNER_OF_INVENTORY": 
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "You are not the owner of this inventory or the inventory does not exist",
        });

      case "INVENTORY_LOCKED":
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "This inventory is locked and cannot be used for bidding",
        });

      case "ACTIVE_BID_EXISTS":
        return sendResponse({
          res,
          statusCode: 409,
          success: false,
          message: "You already have an active bid for this requirement",
        });

      default:
        console.error(error);
        return sendResponse({
          res,
          statusCode: 500,
          success: false,
          message: "Internal server error",
          errors: error?.message ?? null,
        });
    }
  }
}

export const getAllBid = async (req: Request, res: Response) => {
  try {
    const requirementId = req.params.id as string;
    
    if (!requirementId || typeof requirementId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Requirement ID is required",
      });
    }

    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user is admin
    const user = await User.findById(userId).select("role");
    const userRole = user?.role as "admin" | "user" | undefined;

    const bids = await getAllBidsByRequirement(requirementId, userId, userRole);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: bids,
      message: "Fetched all bids according to requirement",
    });
  } catch (error: any) {
    if (error.message === "Requirement not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Requirement not found",
      });
    }

    if (error.message?.includes("not the owner")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: error.message || "You are not authorized to view bids for this requirement",
      });
    }

    console.error("Error in getAllBid:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch bids",
      errors: error?.message ?? "Something went wrong",
    });
  }
}

export const getSellerBid = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user?.id as string | undefined;
    const requirementId = req.params.id as string;

    if (!sellerId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }
    
    const bid = await getSellerService(requirementId, sellerId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: bid,
      message: "SellerId fetched Successfully"
    })
  } catch (error: any) {
    if (error.message === "Requirement not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Requirement not found",
      });
    }

    if (error.message === "Bid not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Bid not found for this requirement",
      });
    }

    console.error("Error in getSellerBid:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch seller bid",
      errors: error.message 
    });
  }
}

export const updateBidStatus = async (req: Request, res: Response) => {
  try {
    const buyerId = (req as any).user?.id as string | undefined;

    if (!buyerId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const bidId = req.params.bidId as string;
    const { status } = req.body;

    if (!bidId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Bid ID is required",
      });
    }

    if (!status || !["ACCEPTED", "REJECTED", "EXPIRED"].includes(status)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Status is required and must be ACCEPTED, REJECTED, or EXPIRED",
      });
    }

    const updatedBid = await updateBidStatusService(buyerId, bidId, status);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Bid ${status.toLowerCase()} successfully`,
      data: updatedBid,
    });
  } catch (error: any) {
    switch (error.message) {
      case "BID_NOT_FOUND":
        return sendResponse({
          res,
          statusCode: 404,
          success: false,
          message: "Bid not found",
        });

      case "REQUIREMENT_NOT_FOUND":
        return sendResponse({
          res,
          statusCode: 404,
          success: false,
          message: "Requirement not found",
        });

      case "NOT_REQUIREMENT_OWNER":
        return sendResponse({
          res,
          statusCode: 403,
          success: false,
          message: "You are not authorized to update this bid. Only the requirement owner can accept or reject bids.",
        });

      case "BID_NOT_SUBMITTED":
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Bid is not in SUBMITTED status and cannot be updated",
        });

      case "REQUIREMENT_NOT_ACTIVE":
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "Requirement is not active. Cannot accept bids for closed or expired requirements.",
        });

      case "BID_ALREADY_ACCEPTED":
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: "A bid has already been accepted for this requirement",
        });

      default:
        console.error("Error in updateBidStatus:", error);
        return sendResponse({
          res,
          statusCode: 500,
          success: false,
          message: "Failed to update bid status",
          errors: error?.message ?? "Something went wrong",
        });
    }
  }
}