import type { Request, Response } from "express";
import sendResponse from "../utils/api.response.js";
import {
  createBidService,
  getAllBidsByAuctionService,
  getMyBidByAuctionService,
  getMyBidByInventoryService,
  updateBidStatusService,
} from "../services/bid.service.js";

export const createBid = async (req: Request, res: Response) => {
  try {
    const auctionId = Array.isArray(req.params.auctionId)
      ? req.params.auctionId[0]
      : req.params.auctionId;
    const { bidAmount } = req.body;

    // from protect middleware
    const buyerId = (req as any).user?.id as string | undefined;

    if (!buyerId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "BuyerId is required",
      });
    }

    if (!auctionId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Valid auctionId is required",
      });
    }

    if (!bidAmount || bidAmount <= 0) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Valid bidAmount is required",
      });
    }

    const bid = await createBidService({
      auctionId,
      buyerId,
      bidAmount,
    });

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Bid placed successfully",
      data: bid ?? null,
    });
  } catch (error: any) {
    if (error.message === "You cannot bid on your own inventory") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "You cannot bid on your own inventory",
      });
    }

    if (error.message === "Inventory not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Inventory not found",
      });
    }

    if (error.message === "Inventory is not available for bidding") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Inventory is not available for bidding",
      });
    }

    if (error.message?.includes("Bid must be higher")) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes("already have the highest bid")) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: error.message,
      });
    }

    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: error.message || "Failed to create bid",
      errors: error,
    });
  }
};

export const getAllBid = async (req: Request, res: Response) => {
  try {
    const auctionId = req.params.auctionId as string;
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as string | undefined;

    if (!auctionId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Auction ID is required",
      });
    }

    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const bids = await getAllBidsByAuctionService(auctionId, userId, role);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Bids fetched successfully",
      data: bids,
    });
  } catch (error: any) {
    if (error.message === "Auction not found" || error.message === "Inventory not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes("not authorized")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "You are not authorized to view bids for this inventory",
      });
    }

    if (error.message?.includes("not authorized")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "You are not authorized to view bids for this inventory",
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to get bids",
      errors: error?.message ?? "Something went wrong",
    });
  }
};

export const getSellerBid = async (req: Request, res: Response) => {
  try {
    const auctionId = req.params.auctionId as string;
    const buyerId = (req as any).user?.id as string | undefined;

    if (!auctionId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Auction ID is required",
      });
    }

    if (!buyerId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const bid = await getMyBidByAuctionService(auctionId, buyerId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: bid ? "Your bid fetched successfully" : "No bid found for this auction",
      data: bid,
    });
  } catch (error: any) {
    if (error.message === "Auction not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Auction not found",
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to get your bid",
      errors: error?.message ?? "Something went wrong",
    });
  }
};

export const updateBidStatus = async (req: Request, res: Response) => {
  try {
    const bidId = req.params.bidId as string;
    const { status } = req.body;
    const userId = (req as any).user?.id as string | undefined;
    const role = (req as any).userRole as "admin" | "user" | undefined;

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

    if (!userId || !role) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
    }

    const updatedBid = await updateBidStatusService(
      bidId,
      status as "ACCEPTED" | "REJECTED" | "EXPIRED",
      userId as string,
      role as "admin" | "user"
    );

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Bid ${status.toLowerCase()} successfully`,
      data: updatedBid,
    });
  } catch (error: any) {
    if (error.message === "Bid not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Bid not found",
      });
    }

    if (error.message === "Inventory not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Inventory not found",
      });
    }

    if (error.message === "Bid is not in SUBMITTED status and cannot be updated") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Bid is not in SUBMITTED status and cannot be updated",
      });
    }

    if (error.message === "You are not authorized to update this bid") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "You are not authorized to update this bid. Only admin or inventory owner can update bid status.",
      });
    }

    if (error.message === "Another bid has already been accepted for this inventory") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Another bid has already been accepted for this inventory",
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update bid status",
      errors: error?.message ?? "Something went wrong",
    });
  }
}