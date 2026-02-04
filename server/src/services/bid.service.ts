import mongoose from "mongoose";
import Bid from "../models/Bid.model.js";
import Inventory from "../models/Inventory.model.js";
import { Auction } from "../models/Auction.model.js";

interface CreateBidInput {
  auctionId: string;
  buyerId: string;
  bidAmount: number;
}

export const createBidService = async ({
  auctionId,
  buyerId,
  bidAmount,
}: CreateBidInput) => {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Fetch auction
  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new Error("Auction not found");
  }

  // 2. Validate auction status (check dates)
  const now = new Date();
  if (now < auction.startDate) {
    throw new Error("Auction has not started yet");
  }
  if (now > auction.endDate) {
    throw new Error("Auction has ended");
  }

  // 3. Fetch inventory
  const inventory = await Inventory.findById(auction.inventoryId) as any;
  console.log("Inventory in createBidService:", inventory);
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 4. Check if buyer is the seller (not allowed)
  if (inventory.sellerId.toString() === buyerId) {
    throw new Error("You cannot bid on your own inventory");
  }

  if (inventory.status === "SOLD" || inventory.locked) {
    throw new Error("Inventory is not available for bidding");
  }

  const currentPrice = auction.currentBid > 0 ? auction.currentBid : auction.basePrice;

  if (bidAmount <= currentPrice) {
    throw new Error(
      `Bid must be higher than current price (${currentPrice})`
    );
  }

  // 5. Check if user already has the highest bid (prevent self-outbidding)
  const currentHighestBid = await Bid.findOne({
    auctionId,
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

      // Remove previous highest bid
      await Bid.updateMany(
        {
          auctionId,
          isHighestBid: true,
        },
        {
          $set: { isHighestBid: false },
        },
        { session }
      );

      // Create new bid
      const bid = await Bid.create(
        [
          {
            auctionId,
            buyerId,
            bidAmount,
            status: "SUBMITTED",
            isHighestBid: true,
          },
        ],
        { session }
      );

      const createdBid = bid[0];
      if (!createdBid) throw new Error("Failed to create bid");

      // Update Auction price and bids
      auction.currentBid = bidAmount;
      auction.highestBidderId = new mongoose.Types.ObjectId(buyerId);
      auction.highestBidId = createdBid._id as mongoose.Types.ObjectId;
      auction.bidIds.push(createdBid._id as mongoose.Types.ObjectId);
      await auction.save({ session });

      // Update Inventory price (optional, but keeping for consistency if needed)
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
    // Remove previous highest bid
    await Bid.updateMany(
      {
        auctionId,
        isHighestBid: true,
      },
      {
        $set: { isHighestBid: false },
      }
    );

    // Create new bid
    const bid = await Bid.create({
      auctionId,
      buyerId,
      bidAmount,
      status: "SUBMITTED",
      isHighestBid: true,
    });

    // Update Auction price and bids
    auction.currentBid = bidAmount;
    auction.highestBidderId = new mongoose.Types.ObjectId(buyerId);
    auction.highestBidId = bid._id as mongoose.Types.ObjectId;
    auction.bidIds.push(bid._id as mongoose.Types.ObjectId);
    await auction.save();

    // Update Inventory price
    inventory.currentBiddingPrice = bidAmount;
    await inventory.save();

    return bid;
  }
};

export const getAllBidsByAuctionService = async (
  auctionId: string,
  userId: string,
  userRole: string | undefined
): Promise<any[]> => {
  // 1. Find auction
  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new Error("Auction not found");
  }

  // 2. Find associated inventory
  const inventory = await Inventory.findById(auction.inventoryId) as any;
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // 3. Check authorization: Admin or inventory owner (seller)
  const isAdmin = userRole === "admin";
  const isOwner = inventory.sellerId.toString() === userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to view bids for this inventory");
  }

  // 4. Fetch all bids for this auction
  const bids = await Bid.find({ auctionId: auction._id })
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

  // 2. Find latest auction
  const auction = await Auction.findOne({ inventoryId }).sort({ createdAt: -1 });
  if (!auction) {
    return null;
  }

  // 3. Find the current user's bid for this auction
  const bid = await Bid.findOne({
    auctionId: auction._id,
    buyerId,
  })
    .populate("buyerId", "username email")
    .populate("auctionId"); // Populating auction instead of inventory directly on bid

  // Return null if no bid found (not an error, just no bid placed yet)
  return bid;
};

export const getMyBidByAuctionService = async (
  auctionId: string,
  buyerId: string
): Promise<any | null> => {
  // 1. Check if auction exists
  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new Error("Auction not found");
  }

  // 2. Find the current user's bid for this auction
  const bid = await Bid.findOne({
    auctionId,
    buyerId,
  })
    .populate("buyerId", "username email")
    .populate("auctionId");

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

  // 3. Get auction, then inventory
  const auction = await Auction.findById(bid.auctionId);
  if (!auction) {
    throw new Error("Auction not found");
  }

  const inventory = await Inventory.findById(auction.inventoryId) as any;
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
      auctionId: bid.auctionId,
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

      if (status === "ACCEPTED") {
        // Expire all other SUBMITTED bids for this inventory
        await Bid.updateMany(
          {
            auctionId: bid.auctionId,
            _id: { $ne: bidId },
            status: "SUBMITTED",
          },
          { $set: { status: "REJECTED" } },
          { session }
        );
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

    if (status === "ACCEPTED") {
      // Expire all other SUBMITTED bids for this inventory
      await Bid.updateMany(
        {
          auctionId: bid.auctionId,
          _id: { $ne: bidId },
          status: "SUBMITTED",
        },
        { $set: { status: "REJECTED" } }
      );
      inventory.status = "ON_MEMO";
      inventory.locked = true;
      await inventory.save();
    }

    return updatedBid;
  }
};
