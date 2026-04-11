import mongoose from "mongoose";
import Inventory from "../models/Inventory.model.js";
import type { IAuction } from "../models/Auction.model.js";
import { Auction } from "../models/Auction.model.js";

interface CreateAuctionInput {
    inventoryId: string;
    basePrice: number;
    startDate: Date;
    endDate: Date;
    recipientId?: string;
}

export const createAuctionService = async ({
    inventoryId,
    basePrice,
    startDate,
    endDate,
    recipientId
}: CreateAuctionInput): Promise<IAuction> => {
    const useTransaction = process.env.NODE_ENV === "production";
    const session = useTransaction ? await mongoose.startSession() : null;

    if (session) {
        session.startTransaction();
    }

    try {
        const inventory = await Inventory.findById(inventoryId).session(session);
        const inAuction = await Auction.findOne({ inventoryId }).session(session);

        if (!inventory) {
            throw new Error("Inventory not found");
        }

        if (inAuction) {
            throw new Error("Inventory is already in auction");
        }

        // 🚫 Only AVAILABLE inventory can be listed
        if (inventory.status !== "AVAILABLE") {
            throw new Error("Inventory must be AVAILABLE to create auction");
        }
        if (inventory.price !== undefined && inventory.price > basePrice) {
            throw new Error("Base price must be greater than inventory price");
        }

        // Create auction
        const auction = await Auction.create(
            [
                {   recipient: recipientId || inventory.sellerId,
                    inventoryId: inventory._id,
                    basePrice,
                    highestBidPrice: basePrice,
                    startDate,
                    endDate,
                    bidIds: [],
                },
            ],
            { session }
        );

        // Update inventory status → LISTED
        inventory.status = "LISTED";
        inventory.locked = true;
        await inventory.save({ session });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        if (!auction[0]) {
            throw new Error("Failed to create auction");
        }

        return auction[0];
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        throw error;
    }
};

export const getAuctionsService = async (query: any = {}): Promise<IAuction[]> => {
    // Basic filtering logic can be expanded here
    const auctions = await Auction.find(query).populate("inventoryId"); // Populate inventory details
    return auctions;
};

export const getAuctionByIdService = async (auctionId: string): Promise<IAuction> => {
    const auction = await Auction.findById(auctionId).populate("inventoryId");
    if (!auction) {
        throw new Error("Auction not found");
    }
    return auction;
};

export const updateAuctionService = async (
    auctionId: string,
    updates: Partial<IAuction>,
): Promise<IAuction> => {
    const auction = await Auction.findById(auctionId).populate("inventoryId");

    if (!auction) {
        throw new Error("Auction not found or You are not allowed to update this auctionbid");
    }

    const inventory = auction.inventoryId as any; // Cast to any or appropriate Inventory interface if available here

    // Apply allowed updates
    if (auction.bidIds && auction.bidIds.length > 0) {
        throw new Error("Cannot update auction with existing bids");
    }

    if (updates.basePrice !== undefined && inventory.price > updates.basePrice) {
        throw new Error("Base price must be greater than inventory price");
    }

    // Prevent updating critical fields if bids exist? For now, allowing basic updates.
    if (updates.basePrice !== undefined) auction.basePrice = updates.basePrice;
    if (updates.startDate) auction.startDate = updates.startDate;
    if (updates.endDate) auction.endDate = updates.endDate;

    await auction.save();
    return auction;
};

export const deleteAuctionService = async (
    auctionId: string,
    userId: string,
    userRole: string
): Promise<void> => {
    const useTransaction = process.env.NODE_ENV === "production";
    const session = useTransaction ? await mongoose.startSession() : null;

    if (session) {
        session.startTransaction();
    }

    try {
        const auction = await Auction.findById(auctionId).populate("inventoryId").session(session);

        if (!auction) {
            throw new Error("Auction not found");
        }

        const inventory = auction.inventoryId as any;

        // 🔐 Authorization: owner or admin
        const isOwner = inventory.sellerId.toString() === userId;
        const isAdmin = userRole === "admin";

        if (!isOwner && !isAdmin) {
            throw new Error("You are not allowed to delete this auction");
        }

        // Check if bids exist - strict mode?
        if (auction.bidIds && auction.bidIds.length > 0) {
            throw new Error("Cannot delete auction with existing bids");
        }

        // Update inventory status back to AVAILABLE
        await Inventory.findByIdAndUpdate(
            inventory._id,
            { status: "AVAILABLE", locked: false },
            { session }
        );

        // Delete auction
        await Auction.findByIdAndDelete(auctionId, { session });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        throw error;
    }
};
