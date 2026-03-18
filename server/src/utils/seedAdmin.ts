import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.model.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding...");

        const adminEmail = "admin@yopmail.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin user already exists. Skipping seed.");
            process.exit(0);
        }

        const adminUser = new User({
            username: "System Admin",
            email: adminEmail,
            password: "adminpassword123", // Note: This will be hashed by the User model's pre-save hook
            role: "admin",
            isVerified: true,
            accountStatus: "ACTIVE",
            isKycVerified: true
        });

        await adminUser.save();
        console.log("Admin user seeded successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: adminpassword123`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin user:", error);
        process.exit(1);
    }
};

seedAdmin();
