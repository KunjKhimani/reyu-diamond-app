import type { Request, Response, NextFunction } from "express"
import sendResponse from "../utils/api.response.js"
import { createInventoryService, getAllInventoriesService, updateInventoryService, findInventoryById, deleteInventoryService } from "../services/inventory.service.js"
import { generateUniqueBarcode } from "../utils/barcode.util.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import mongoose from "mongoose";
import { checkAndNotifyRequirements } from "../services/notification.service.js";
import { addClodinaryJob } from "../queues/cloudinary.queue.js";


export const createInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const barcode = await generateUniqueBarcode();

    // Prepare media for background upload if present
    const mediaToUpload: { path: string; fieldname: string; originalname: string }[] = [];
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.images) {
        files.images.forEach(f => mediaToUpload.push({ path: f.path, fieldname: f.fieldname, originalname: f.originalname }));
      }
      if (files.video && files.video.length > 0) {
        mediaToUpload.push({ path: files.video[0]!.path, fieldname: files.video[0]!.fieldname, originalname: files.video[0]!.originalname });
      }
    }

    const inventory = await createInventoryService(
      userId,
      barcode,
      req.body,
      [], // Empty initially
      undefined,
      mediaToUpload.length > 0 ? "PENDING" : "COMPLETED"
    );

    // If there are files, queue the background upload
    if (mediaToUpload.length > 0) {
      addClodinaryJob({
        action: "upload_inventory_media",
        inventoryId: inventory._id.toString(),
        files: mediaToUpload,
      }).catch((err: any) => console.error("[CreateInventory] Queue error:", err));
    }


    // Check for matching requirements and notify users - nofification
    checkAndNotifyRequirements(inventory).catch((err: any) =>
      console.error("Error in checkAndNotifyRequirements background task:", err)
    );

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      data: inventory,
      message: "Inventory created successfully",
    });
    } catch (error: any) {
    console.error("[CreateInventory] Error:", error);
    next(Object.assign(new Error(error.message || "Failed to create inventory"), { statusCode: 500 }));
  }
};

export const getAllInventories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const requirements = await getAllInventoriesService(filters);
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: requirements,
      message: "All Inventories fetched successfully",
    });
  } catch (error) {
    next(Object.assign(new Error("Failed to fetch inventories"), { statusCode: 500 }));
  }
};

export const getInventoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    if (!id || typeof id !== "string") {
      next(Object.assign(new Error("Inventory ID is required"), { statusCode: 400 }));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      next(Object.assign(new Error("Invalid inventory ID format"), { statusCode: 400 }));
    }
    const inventory = await findInventoryById(id);

    if (!inventory) {
      next(Object.assign(new Error("Inventory not found"), { statusCode: 404 }));
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

export const updateInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user.id;
    const userRole = (req as any).userRole;

    if (!id || typeof id !== "string") {
      next(Object.assign(new Error("Inventory ID is required"), { statusCode: 400 }));
    }

    const updatedItem = await updateInventoryService(
      id,
      userId,
      req.body,
      userRole
    );

    if (!updatedItem) {
      next(Object.assign(new Error("Inventory not found or unauthorized"), { statusCode: 404 }));
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: updatedItem,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id:string };
    const userId = (req as any).user.id;
    const userRole = (req as any).userRole;
    if (!id || typeof id !== "string") {
      next(Object.assign(new Error("Inventory ID is required"), { statusCode: 400 }));
    }
    const deletedInventory = await deleteInventoryService(userId, id, userRole);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      data: deletedInventory,
      message: "Inventory deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
}
