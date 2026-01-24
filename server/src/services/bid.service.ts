import Bid, { type IBid } from "../models/Bid.model.js";
import Requirement from "../models/requirement.model.js";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.model.js";

export const placeBid = async (requirementId:string, sellerId: string, data: any): Promise<IBid> => {
  // 1. Validate requirement
  const requirement = await Requirement.findById(requirementId);

  if (!requirement) {
    throw new Error("REQUIREMENT_NOT_FOUND");
  }

  // 2. Requirement must be active
  if (requirement.status !== "active") {
    throw new Error("REQUIREMENT_NOT_ACTIVE");
  }

  // 3. Buyer cannot bid on own requirement
  if (requirement.buyerId.toString() === sellerId) {
    throw new Error("CANNOT_BID_OWN_REQUIREMENT");
  }

  // 4. Create bid (unique SUBMITTED enforced by index)
  try {
    const bidData: any = {
      requirementId,
      sellerId,
      ...data
    };  

    if(data.inventoryId) {
      // Validate that the specific inventory belongs to the seller
      const inventory = await Inventory.findOne({ 
        _id: data.inventoryId, 
        sellerId 
      });
      
      if (!inventory) {
        throw new Error("NOT_OWNER_OF_INVENTORY");
      }
      
      // Additional check: ensure inventory is not locked
      if (inventory.locked) {
        throw new Error("INVENTORY_LOCKED");
      }
      
      bidData.inventoryId = new mongoose.Types.ObjectId(data.inventoryId);
    }

    const bid = await Bid.create(bidData);

    return bid;
  } catch (error: any) {
    // Duplicate active bid
    if (error.code === 11000) {
      throw new Error("ACTIVE_BID_EXISTS");
    }
    throw error;
  }
}

export const getAllBidsByRequirement = async (
  requirementId: string,
  userId: string,
  userRole?: "admin" | "user"
): Promise<IBid[] | null> => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    throw new Error("Requirement not found");
  }

  const isOwner = userId === requirement.buyerId.toString();
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("You are not the owner of this requirement, so you cannot see all bids.");
  }

  const bids = await Bid.find({ requirementId });

  return bids;
};

export const getSellerService = async (
  requirementId: string,
  sellerId: string
) => {
  // First validate that the requirement exists
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    throw new Error("Requirement not found");
  }

  const sellerBid = await Bid.findOne({
    requirementId,
    sellerId
  }).populate("requirementId");

  if (!sellerBid) {
    throw new Error("Bid not found");
  }

  return sellerBid;
}

export const updateBidStatusService = async (
  buyerId: string,
  bidId: string,
  status: "ACCEPTED" | "REJECTED" | "EXPIRED"
): Promise<IBid> => {
  
  const bid = await Bid.findOne({ _id: bidId, status: "SUBMITTED" });
  if (!bid) throw new Error("BID_NOT_FOUND");

  const requirement = await Requirement.findById(bid.requirementId);
  if (!requirement) throw new Error("REQUIREMENT_NOT_FOUND");

  if (requirement.buyerId.toString() !== buyerId) {
    throw new Error("NOT_REQUIREMENT_OWNER");
  }

  if (status === "ACCEPTED" && requirement.status !== "active") {
    throw new Error("REQUIREMENT_NOT_ACTIVE");
  }

  if (status === "ACCEPTED") {
    const existingAcceptedBid = await Bid.findOne({
      requirementId: bid.requirementId,
      status: "ACCEPTED",
    });
    if (existingAcceptedBid) throw new Error("BID_ALREADY_ACCEPTED");

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Use transactions in production (requires replica set)
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const updatedBid = await Bid.findByIdAndUpdate(
          bidId,
          { status: "ACCEPTED" },
          { new: true, session }
        );
        await Requirement.findByIdAndUpdate(
          bid.requirementId,
          { status: "closed" },
          { session }
        );
        await Bid.updateMany(
          { requirementId: bid.requirementId, status: "SUBMITTED", _id: { $ne: bidId } },
          { status: "REJECTED" },
          { session }
        );
        await session.commitTransaction();
        session.endSession();
        return updatedBid!;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } else {
      // Simple CRUD operations in development
      const updatedBid = await Bid.findByIdAndUpdate(
        bidId,
        { status: "ACCEPTED" },
        { new: true }
      );
      await Requirement.findByIdAndUpdate(
        bid.requirementId,
        { status: "closed" }
      );
      await Bid.updateMany(
        { requirementId: bid.requirementId, status: "SUBMITTED", _id: { $ne: bidId } },
        { status: "REJECTED" }
      );
      return updatedBid!;
    }
  }

  const updatedBid = await Bid.findByIdAndUpdate(
    bidId,
    { status },
    { new: true }
  );
  if (!updatedBid) throw new Error("BID_NOT_FOUND");
  return updatedBid;
}