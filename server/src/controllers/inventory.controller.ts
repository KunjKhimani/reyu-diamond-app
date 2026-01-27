import type { Request, Response } from "express"
import sendResponse from "../utils/api.response.js"
import { createInventoryService, getAllInventoriesService, updateInventoryService, findInventoryById, deleteInventoryService } from "../services/inventory.service.js"
import { generateUniqueBarcode } from "../utils/barcode.util.js";

export const createInventory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: "Unauthorized",
            });
        }

        const barcode = await generateUniqueBarcode();

        const inventory = await createInventoryService(userId, barcode, req.body);

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            data: inventory,
            message: "Inventory created successfully",
        })
    } catch (error) {
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: "Failed to create Invenotry",
            errors: (error as Error).message || "Something went wrong"
        })
    }
}

export const getAllInventories = async (req: Request, res: Response) => {
  try {
    const requirements = await getAllInventoriesService();
    return sendResponse({
        res,
        statusCode: 200,
        success: true,
        data: requirements,
        message: "All Requirements fetched successfully",
    });
  } catch (error) {
    return sendResponse({
        res,
        statusCode: 500,
        success: false,
        message: "Failed to fetch requirements",
        errors: (error as Error).message || "Something went wrong",
    });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: "Inventory ID is required",
            });
        }

        const inventory = await findInventoryById(id);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            data: inventory,
            message: "Inventory fetched successfully",
        });
    } catch (error) {
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: "Failed to fetch inventory",
            errors: (error as Error).message ?? "Something went wrong",
        })
    }
}

export const updateInventory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: "Not authorized",
            });
        }

        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: "Inventory ID is required",
            });
        }

        const updatedItem = await updateInventoryService(
            id,
            userId,
            req.body
        );

        if (!updatedItem) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: "Inventory not found or unauthorized",
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            data: updatedItem,
            message: "Inventory updated successfully",
        });
    } catch (error) {
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: "Failed to update inventory",
            errors: (error as Error).message ?? "Something went wrong",
        });
    }
};

export const deleteInventory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
            return sendResponse({
                res,
                statusCode: 401,
                success: false,
                message: "Unauthorized",
            });
        }

        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: "Inventory ID is required",
            });
        }

        const deletedInventory = await deleteInventoryService(id, userId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            data: deletedInventory,
            message: "Inventory deleted successfully",
        });
    } catch (error: any) {
        const statusCode = error?.statusCode || 500;
        const message = error?.message || "Failed to delete inventory";

        return sendResponse({
            res,
            statusCode,
            success: false,
            message,
            errors: message,
        });
    }
}
