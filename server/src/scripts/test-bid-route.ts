
import mongoose from "mongoose";
import dotenv from "dotenv";
import { getAllBidsByAuctionService, createBidService } from "../services/bid.service.js";
import User from "../models/User.model.js";
import Inventory from "../models/Inventory.model.js";
import { Auction } from "../models/Auction.model.js";
import Bid from "../models/Bid.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI?.replace("reyu-diamond-app", "reyu-diamond-app-test") || "mongodb://localhost:27017/reyu-diamond-app-test";

async function runTest() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    let sellerId: string;
    let buyerId: string;
    let adminId: string;
    let inventoryId: string;
    let auctionId: string;

    try {
        // 1. Setup Users
        const seller = await User.create({
            username: `seller_${Date.now()}`,
            email: `seller_${Date.now()}@example.com`,
            password: "password123",
            role: "user",
            isVerified: true,
        }) as any;
        sellerId = seller._id.toString();

        const buyer = await User.create({
            username: `buyer_${Date.now()}`,
            email: `buyer_${Date.now()}@example.com`,
            password: "password123",
            role: "user",
            isVerified: true,
        }) as any;
        buyerId = buyer._id.toString();

        const admin = await User.create({
            username: `admin_${Date.now()}`,
            email: `admin_${Date.now()}@example.com`,
            password: "password123",
            role: "admin",
            isVerified: true,
        }) as any;
        adminId = admin._id.toString();

        // 2. Create Inventory
        const inventory = await Inventory.create({
            sellerId,
            title: "Test Diamond",
            barcode: `BAR_${Date.now()}`,
            carat: 1.0,
            cut: "EXCELLENT",
            color: "D",
            clarity: "VS1",
            shape: "ROUND",
            lab: "GIA",
            location: "NY",
            price: 1000,
            status: "AVAILABLE",
        }) as any;
        inventoryId = inventory._id.toString();

        // 3. Create Auction
        const startDate = new Date();
        startDate.setMinutes(startDate.getMinutes() - 10); // Started 10 mins ago
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 24); // Ends in 24 hours

        const auction = await Auction.create({
            inventoryId,
            basePrice: 500,
            startDate,
            endDate,
        }) as any;
        auctionId = auction._id.toString();

        // 4. Place Bid (as Buyer)
        await createBidService({
            auctionId,
            buyerId,
            bidAmount: 600,
        });
        console.log("Bid placed successfully");

        // 5. Test getAllBidsByAuctionService

        // Case A: Seller (Owner) - Should succeed
        console.log("\nTesting Seller Access (Owner)...");
        try {
            const bids = await getAllBidsByAuctionService(auctionId, sellerId, "user");
            console.log("✅ Seller Access Success: Found", bids.length, "bids");
        } catch (error: any) {
            console.error("❌ Seller Access Failed:", error.message);
        }

        // Case B: Buyer (Non-Owner) - Should fail
        console.log("\nTesting Buyer Access (Non-Owner)...");
        try {
            await getAllBidsByAuctionService(auctionId, buyerId, "user");
            console.error("❌ Buyer Access Failed: Should have thrown an error");
        } catch (error: any) {
            if (error.message === "You are not authorized to view bids for this inventory") {
                console.log("✅ Buyer Access Correctly Denied");
            } else {
                console.error("❌ Buyer Access Incorrect Error:", error.message);
            }
        }

        // Case C: Admin - Should succeed
        console.log("\nTesting Admin Access...");
        try {
            const bids = await getAllBidsByAuctionService(auctionId, adminId, "admin");
            console.log("✅ Admin Access Success: Found", bids.length, "bids");
        } catch (error: any) {
            console.error("❌ Admin Access Failed:", error.message);
        }

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        // Cleanup
        if (auctionId!) {
            await Bid.deleteMany({ auctionId });
            await Auction.deleteOne({ _id: auctionId });
        }
        await Inventory.deleteOne({ _id: inventoryId! });
        await User.deleteMany({ _id: { $in: [sellerId!, buyerId!, adminId!] } });

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    }
}

runTest();
