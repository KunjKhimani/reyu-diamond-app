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

export const getAllInventoriesService = async (): Promise<IInventory[]> => {
    const inventories = await Inventory.find();
    return inventories;
}

export const updateInventoryService = async (
    inventoryId: string,
    userId: string,
    updateData: any
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

    if (inv.sellerId.toString() !== userId) {
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
    inventoryId: string
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

    if (inv.sellerId.toString() !== userId) {
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