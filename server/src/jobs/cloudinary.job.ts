import fs from "fs";
import { deleteFromCloudinary, uploadDiskFileToCloudinary } from "../services/cloudinary.service.js";
import Inventory from "../models/Inventory.model.js";

export type CloudinaryAction = "delete" | "upload_url" | "upload_inventory_media";

export interface CloudinaryJobData {
  action: CloudinaryAction;
  publicId?: string;
  resourceType?: "image" | "video" | "auto" | "raw";
  url?: string;
  folder?: string;
  inventoryId?: string;
  files?: { path: string; fieldname: string; originalname: string }[];
}

export const processCloudinaryJob = async (data: CloudinaryJobData): Promise<void> => {
  const { action, publicId, resourceType, url, folder, inventoryId, files } = data;
  console.log(`[CloudinaryJob] Processing action: ${action}`);

  try {
    switch (action) {
      case "delete":
        if (!publicId) throw new Error("publicId is required for delete action");
        await deleteFromCloudinary(publicId, resourceType || "image");
        console.log(`[CloudinaryJob] Successfully deleted: ${publicId}`);
        break;

      case "upload_inventory_media":
        if (!inventoryId || !files) throw new Error("inventoryId and files are required");
        
        await Inventory.findByIdAndUpdate(inventoryId, { uploadStatus: "PROCESSING" });
        
        const imageUrls: string[] = [];
        let videoUrl: string | undefined;

        for (const file of files) {
          try {
            const isVideo = file.fieldname === "video";
            const uploadResult = await uploadDiskFileToCloudinary(
              file.path,
              isVideo ? "inventory/videos" : "inventory/images",
              isVideo ? "video" : "image"
            );
            
            if (isVideo) {
              videoUrl = uploadResult.secure_url;
            } else {
              imageUrls.push(uploadResult.secure_url);
            }

            // Delete local file after upload
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (uploadErr) {
            console.error(`[CloudinaryJob] Failed to upload file ${file.path}:`, uploadErr);
            // Even if one fails, we continue with others
          }
        }

        // Update database with final URLs
        await Inventory.findByIdAndUpdate(inventoryId, {
          images: imageUrls,
          ...(videoUrl && { video: videoUrl }),
          uploadStatus: "COMPLETED"
        });
        
        console.log(`[CloudinaryJob] Successfully processed inventory media for ${inventoryId}`);
        break;

      case "upload_url":
        console.log(`[CloudinaryJob] URL upload triggered for ${url}`);
        break;

      default:
        throw new Error(`Unknown Cloudinary action: ${action}`);
    }
  } catch (error) {
    console.error(`[CloudinaryJob] Failed to process ${action}:`, error);
    if (inventoryId && action === "upload_inventory_media") {
      await Inventory.findByIdAndUpdate(inventoryId, { uploadStatus: "FAILED" });
    }
    throw error;
  }
};