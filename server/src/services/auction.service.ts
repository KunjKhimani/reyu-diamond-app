import mongoose from "mongoose";
import Inventory from "../models/Inventory.model.js";
import type { IAuction } from "../models/Auction.model.js";
import { Auction } from "../models/Auction.model.js";
import { publishEvent } from "../utils/publisher.js";

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
        if (inventory.price > basePrice) {
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

        // Invalidate inventory caches as status changed to LISTED
        publishEvent("inventory-cache-updates", { type: "INVALIDATE_INVENTORY_CACHE" }).catch(err => 
            console.error("Cache invalidation failed after auction creation:", err)
        );

        return auction[0];
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        throw error;
    }
};

import { paginationCache } from "../utils/cache.util.js";

export const getAuctionsFromDB = async (query: any = {}): Promise<{ auctions: IAuction[], pagination: any }> => {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const auctions = await Auction.find(filters)
        .populate("inventoryId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await Auction.countDocuments(filters);

    return {
        auctions,
        pagination: {
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            pages: Math.ceil(total / parseInt(limit as string)),
        }
    };
};

export const getAuctionsService = async (query: any = {}) => {
    return await paginationCache(
        "auction_list",
        query,
        getAuctionsFromDB,
        { ttl: 300 } // 5 minutes cache
    );
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

        // Invalidate inventory caches as status changed back to AVAILABLE
        publishEvent("inventory-cache-updates", { type: "INVALIDATE_INVENTORY_CACHE" }).catch(err => 
            console.error("Cache invalidation failed after auction deletion:", err)
        );
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        throw error;
    }
};
