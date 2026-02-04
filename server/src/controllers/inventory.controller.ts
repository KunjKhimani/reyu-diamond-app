import type { Request, Response } from "express"
import sendResponse from "../utils/api.response.js"
import { createInventoryService, getAllInventoriesService, updateInventoryService, findInventoryById, deleteInventoryService } from "../services/inventory.service.js"
import { generateUniqueBarcode } from "../utils/barcode.util.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import mongoose from "mongoose";
import { getUserById } from "../services/auth.service.js";

export const createInventory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const barcode = await generateUniqueBarcode();

    // Upload images and video if present
    let imageUrls: string[] = [];
    let videoUrl: string | undefined;

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.images) {
        imageUrls = await Promise.all(
          files.images.map((file) => uploadToCloudinary(file, "inventory/images"))
        );
      }

      if (files.video && files.video.length > 0) {
        videoUrl = await uploadToCloudinary(files.video[0] as Express.Multer.File, "inventory/videos", "auto");
      }
    }

    const inventory = await createInventoryService(
      userId,
      barcode,
      req.body,
      imageUrls,
      videoUrl
    );

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      data: inventory,
      message: "Inventory created successfully",
    });
  } catch (error) {
    console.log(error)
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to create inventory",
      errors: (error as Error).message,
    });
  }
};

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid inventory ID format",
      });
    }
    const inventory = await findInventoryById(id);

    if (!inventory) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Inventory not found",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inventory fetched successfully",
      data: inventory,
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
    const { id } = req.params;
    const userId = (req as any).user.id;

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
    const { id } = req.params;
    const userId = (req as any).user.id;
    if (!id || typeof id !== "string") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Inventory ID is required",
      });
    }
    const deletedInventory = await deleteInventoryService(userId, id);

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
