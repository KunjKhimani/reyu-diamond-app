import mongoose from "mongoose";
import type { IInventory } from "../models/Inventory.model.js";
import Inventory from "../models/Inventory.model.js";

export const createInventoryService = async (userId: string, barcode: string, inventoryData: any): Promise<IInventory> => {
    const newInventory = {
        sellerId: userId,
        barcode: barcode,
        ...inventoryData,
        status: "IN_LOCKER",
        createdAt: new Date(),
    }

    const inventory = await Inventory.create(newInventory);

    return inventory;
}

export const getAllInventoriesService = async (): Promise<IInventory[]> => {
    const inventories = await Inventory.find();
    return inventories;
}

export const updateInventoryService = async (
  inventoryId: string,
  updateData: any
) => {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw {
        statusCode: 400,
        message: "Invalid inventory id",
        };
    }
    const inventory = Inventory.findOneAndUpdate(
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
  inventoryId: string
) => {

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        throw {
        statusCode: 400,
        message: "Invalid inventory id",
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