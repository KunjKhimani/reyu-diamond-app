import mongoose from "mongoose";
import Bid from "../models/Bid.model.js";
import Inventory from "../models/Inventory.model.js";

interface CreateBidInput {
  inventoryId: string;
  buyerId: string;
  bidAmount: number;
}

export const createBidService = async ({
  inventoryId,
  buyerId,
  bidAmount,
}: CreateBidInput) => {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Fetch inventory
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 2. Check if buyer is the seller (not allowed)
  if (inventory.sellerId.toString() === buyerId) {
    throw new Error("You cannot bid on your own inventory");
  }

  if (inventory.status === "SOLD" || inventory.locked) {
    throw new Error("Inventory is not available for bidding");
  }

  const currentPrice =
    inventory.currentBiddingPrice || inventory.basePrice;

  if (bidAmount <= currentPrice) {
    throw new Error(
      `Bid must be higher than current price (${currentPrice})`
    );
  }

  // 3. Check if user already has the highest bid (prevent self-outbidding)
  const currentHighestBid = await Bid.findOne({
    inventoryId,
    isHighestBid: true,
  });

  if (currentHighestBid && currentHighestBid.buyerId.toString() === buyerId) {
    throw new Error("You already have the highest bid. Wait for someone else to outbid you before placing a new bid.");
  }

  if (isProduction) {
    // Use transactions in production (requires replica set)
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 2. Remove previous highest bid
      await Bid.updateMany(
        {
          inventoryId,
          isHighestBid: true,
        },
        {
          $set: { isHighestBid: false },
        },
        { session }
      );

      // 3. Create new bid
      const bid = await Bid.create(
        [
          {
            inventoryId,
            buyerId,
            bidAmount,
            status: "SUBMITTED",
            isHighestBid: true,
          },
        ],
        { session }
      );

      // 4. Update inventory price
      inventory.currentBiddingPrice = bidAmount;
      await inventory.save({ session });

      await session.commitTransaction();
      session.endSession();

      return bid[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } else {
    // Direct CRUD operations in development
    // 2. Remove previous highest bid
    await Bid.updateMany(
      {
        inventoryId,
        isHighestBid: true,
      },
      {
        $set: { isHighestBid: false },
      }
    );

    // 3. Create new bid
    const bid = await Bid.create({
      inventoryId,
      buyerId,
      bidAmount,
      status: "SUBMITTED",
      isHighestBid: true,
    });

    // 4. Update inventory price
    inventory.currentBiddingPrice = bidAmount;
    await inventory.save();

    return bid;
  }
};

export const getAllBidsByInventoryService = async (
  inventoryId: string,
  userId: string,
  userRole: "admin" | "user"
): Promise<any[]> => {
  // 1. Check if inventory exists
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 2. Check authorization: Admin or inventory owner (seller)
  const isAdmin = userRole === "admin";
  const isOwner = inventory.sellerId.toString() === userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to view bids for this inventory");
  }

  // 3. Fetch all bids for this inventory
  const bids = await Bid.find({ inventoryId })
    .populate("buyerId", "username email")
    .sort({ createdAt: -1 }); // Latest bids first

  return bids;
};

export const getMyBidByInventoryService = async (
  inventoryId: string,
  buyerId: string
): Promise<any | null> => {
  // 1. Check if inventory exists
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 2. Find the current user's bid for this inventory
  const bid = await Bid.findOne({
    inventoryId,
    buyerId,
  })
    .populate("buyerId", "username email")
    .populate("inventoryId", "barcode shape carat color clarity lab location basePrice currentBiddingPrice status");

  // Return null if no bid found (not an error, just no bid placed yet)
  return bid;
};

export const updateBidStatusService = async (
  bidId: string,
  status: "ACCEPTED" | "REJECTED" | "EXPIRED",
  userId: string,
  userRole: "admin" | "user"
): Promise<any> => {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Find the bid
  const bid = await Bid.findById(bidId);
  if (!bid) {
    throw new Error("Bid not found");
  }

  // 2. Validate bid is in SUBMITTED status
  if (bid.status !== "SUBMITTED") {
    throw new Error("Bid is not in SUBMITTED status and cannot be updated");
  }

  // 3. Get inventory and check authorization
  const inventory = await Inventory.findById(bid.inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 4. Check authorization: Admin or inventory owner (seller)
  const isAdmin = userRole === "admin";
  const isOwner = inventory.sellerId.toString() === userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to update this bid");
  }

  // 5. If accepting, check if another bid is already accepted
  if (status === "ACCEPTED") {
    const existingAcceptedBid = await Bid.findOne({
      inventoryId: bid.inventoryId,
      status: "ACCEPTED",
    });

    if (existingAcceptedBid && existingAcceptedBid._id.toString() !== bidId) {
      throw new Error("Another bid has already been accepted for this inventory");
    }
  }

  if (isProduction) {
    // Use transactions in production
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Update bid status
      const updatedBid = await Bid.findByIdAndUpdate(
        bidId,
        { status },
        { new: true, session }
      );

      // If bid is ACCEPTED, update inventory status to ON_MEMO
      if (status === "ACCEPTED") {
        inventory.status = "ON_MEMO";
        inventory.locked = true;
        await inventory.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return updatedBid;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } else {
    // Direct CRUD operations in development
    const updatedBid = await Bid.findByIdAndUpdate(
      bidId,
      { status },
      { new: true }
    );

    // If bid is ACCEPTED, update inventory status to ON_MEMO
    if (status === "ACCEPTED") {
      inventory.status = "ON_MEMO";
      inventory.locked = true;
      await inventory.save();
    }

    return updatedBid;
  }
};
