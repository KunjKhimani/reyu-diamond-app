import mongoose from "mongoose";
import type { IInventory } from "../models/Inventory.model.js";
import Inventory from "../models/Inventory.model.js";

export const createInventoryService = async (
    userId: string,
    barcode: string,
    inventoryData: Partial<IInventory>,
    images: string[],
    video?: string
): Promise<IInventory> => {

    // Check for duplicates
    const existingInventory = await Inventory.findOne({
        sellerId: userId,
        carat: inventoryData.carat as number,
        cut: inventoryData.cut as string,
        color: inventoryData.color as string,
        clarity: inventoryData.clarity as string,
        shape: inventoryData.shape as string,
        lab: inventoryData.lab as string,
        status: { $ne: "SOLD" }
    });

    if (existingInventory) {
        throw {
            statusCode: 400,
            message: "Duplicate inventory found with same specs (not SOLD)",
        };
    }

    const newInventory = {
        sellerId: userId,
        barcode,
        title: inventoryData.title!,
        carat: inventoryData.carat!,
        cut: inventoryData.cut!,
        color: inventoryData.color!,
        clarity: inventoryData.clarity!,
        shape: inventoryData.shape!,
        lab: inventoryData.lab!,
        location: inventoryData.location!,
        price: inventoryData.price!,
        currency: inventoryData.currency || "USD",
        images,
        video,
        status: "AVAILABLE",
        locked: false,
        ...(inventoryData.description && {
            description: inventoryData.description,
        }),
    };

    const inventory = await Inventory.create(newInventory as any);
    return inventory;
};

import { paginationCache } from "../utils/cache.util.js";

export const getAllInventoriesFromDB = async (filters: any = {}): Promise<{ inventories: IInventory[], pagination: any }> => {
    const query: any = {};
    const { page = 1, limit = 10 } = filters;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    if (filters.status) query.status = filters.status;

    // Categorical filters (comma-separated support)
    const categoricalFields = ['cut', 'color', 'clarity', 'shape', 'lab', 'location'];
    categoricalFields.forEach(field => {
        if (filters[field]) {
            const values = filters[field].split(',').map((v: string) => v.trim());
            if (values.length > 0) query[field] = { $in: values };
        }
    });

    // Numerical range filters
    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
    }

    if (filters.minCarat || filters.maxCarat) {
        query.carat = {};
        if (filters.minCarat) query.carat.$gte = Number(filters.minCarat);
        if (filters.maxCarat) query.carat.$lte = Number(filters.maxCarat);
    }

    // Search by title or barcode (optional enhancement)
    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { barcode: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const inventories = await Inventory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await Inventory.countDocuments(query);

    return {
        inventories,
        pagination: {
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            pages: Math.ceil(total / parseInt(limit as string)),
        }
    };
};

export const getAllInventoriesService = async (filters: any = {}) => {
    return await paginationCache(
        "inventory_list",
        filters,
        getAllInventoriesFromDB,
        { ttl: 600 } // 10 minutes cache
    );
};

export const updateInventoryService = async (
    inventoryId: string,
    userId: string,
    updateData: any,
    userRole?: string
) => {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw {
            statusCode: 400,
            message: "Invalid inventory id",
        };
    }
    const inv = await Inventory.findById(inventoryId);
    if (!inv) {
        throw {
            statusCode: 404,
            message: "Inventory not found",
        };
    }

    if (inv.sellerId.toString() !== userId && userRole !== "admin") {
        throw {
            statusCode: 403,
            message: "You are not authorized to update this inventory",
        };
    }

    const inventory = await Inventory.findOneAndUpdate(
        {
            _id: inventoryId,
            locked: false,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!inventory) {
        const exists = await Inventory.exists({ _id: inventoryId });

        if (!exists) {
            throw {
                statusCode: 404,
                message: "Inventory not found",
            };
        }

        throw {
            statusCode: 403,
            message: "Inventory is locked and cannot be updated",
        };
    }

    return inventory;
};

export const findInventoryById = async (inventoryId: string): Promise<IInventory | null> => {
    return Inventory.findById(inventoryId);
}

export const deleteInventoryService = async (
    userId: string,
    inventoryId: string,
    userRole?: string
) => {

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw {
            statusCode: 400,
            message: "Invalid inventory id",
        };
    }
    const inv = await Inventory.findById(inventoryId);
    if (!inv) {
        throw {
            statusCode: 404,
            message: "Inventory not found",
        };
    }

    if (inv.sellerId.toString() !== userId && userRole !== "admin") {
        throw {
            statusCode: 403,
            message: "You are not authorized to delete this inventory",
        };
    }

    const inventory = await Inventory.findOneAndDelete({
        _id: inventoryId,
        locked: false,
    });

    if (!inventory) {
        const exists = await Inventory.exists({ _id: inventoryId });

        if (!exists) {
            throw {
                statusCode: 404,
                message: "Inventory not found",
            };
        }

        throw {
            statusCode: 403,
            message: "Inventory is locked and cannot be deleted",
        };
    }

    return inventory;
};