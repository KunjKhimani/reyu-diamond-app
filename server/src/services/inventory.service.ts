import mongoose from "mongoose";
import type { IInventory } from "../models/Inventory.model.js";
import Inventory from "../models/Inventory.model.js";
import { addClodinaryJob } from "../queues/cloudinary.queue.js";
import { getPublicIdFromUrl } from "../utils/cloudinary.util.js";


export const createInventoryService = async (
    userId: string,
    barcode: string,
    inventoryData: Partial<IInventory>,
    images: string[] = [],
    video?: string,
    uploadStatus: "PENDING" | "COMPLETED" = "COMPLETED"
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
        uploadStatus,
        locked: false,
        ...(inventoryData.description && {
            description: inventoryData.description,
        }),
    };

    const inventory = await Inventory.create(newInventory as any);
    return inventory;
};

export const getAllInventoriesService = async (filters: any = {}): Promise<IInventory[]> => {
    const query: any = {};

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

    const inventories = await Inventory.find(query).sort({ createdAt: -1 });
    return inventories;
}

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


    // Queue Cloudinary image deletion in the background
    if (inventory.images && inventory.images.length > 0) {
      inventory.images.forEach((imageUrl: string) => {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          addClodinaryJob({ action: "delete", publicId, resourceType: "image" }).catch((err) =>
            console.error(`[DeleteInventory] Failed to queue image deletion for ${publicId}:`, err)
          );
        }
      });
    }

    // Queue video deletion if present
    if (inventory.video) {
      const publicId = getPublicIdFromUrl(inventory.video);
      if (publicId) {
        addClodinaryJob({ action: "delete", publicId, resourceType: "video" }).catch((err) =>
          console.error(`[DeleteInventory] Failed to queue video deletion for ${publicId}:`, err)
        );
      }
    }

    return inventory;

};