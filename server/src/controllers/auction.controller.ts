import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import { createAuctionService, getAuctionsService, getAuctionByIdService, updateAuctionService, deleteAuctionService } from "../services/auction.service.js";

interface AuthenticatedRequest extends Request {
  user?: any;
  userRole?: string;
}

export const createAuction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inventoryId } = req.params;
    const { basePrice, startDate, endDate } = req.body;

    if (!inventoryId || typeof inventoryId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid Inventory ID",
      });
    }

    if (!basePrice || !startDate || !endDate) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Missing required fields",
      });
    }

    if (!req.user || !req.user.id) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const auction = await createAuctionService({
      inventoryId,
      basePrice,
      startDate,
      endDate,
      userId: req.user.id,
      userRole: req.userRole || "",
    });

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Auction created successfully",
      data: auction,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: (error as Error).message || "Failed to create auction",
    });
  }
};

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const auctions = await getAuctionsService(query);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Auctions retrieved successfully",
      data: auctions,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: (error as Error).message || "Failed to retrieve auctions",
    });
  }
};

export const getAuction = async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId || typeof auctionId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid Auction ID",
      });
    }

    const auction = await getAuctionByIdService(auctionId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Auction retrieved successfully",
      data: auction,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 404, // Assuming error implies not found or bad request, but 404 is common for ID lookups failure
      success: false,
      message: (error as Error).message || "Failed to retrieve auction",
    });
  }
};

export const updateAuction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { auctionId } = req.params;
    const updates = req.body;

    if (!auctionId || typeof auctionId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid Auction ID",
      });
    }

    if (!req.user || !req.user.id) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const auction = await updateAuctionService(
      auctionId,
      updates,
      req.user.id,
      req.userRole || ""
    );

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Auction updated successfully",
      data: auction,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: (error as Error).message || "Failed to update auction",
    });
  }
};

export const deleteAuction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId || typeof auctionId !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid Auction ID",
      });
    }

    if (!req.user || !req.user.id) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    await deleteAuctionService(auctionId, req.user.id, req.userRole || "");

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Auction deleted successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: (error as Error).message || "Failed to delete auction",
    });
  }
};
