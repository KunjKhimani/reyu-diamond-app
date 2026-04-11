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

export const processCloudinaryJob = async (data: CloudinaryJobData, attempts: number = 0): Promise<void> => {
  const { action, publicId, resourceType, url, folder, inventoryId, files } = data;
  console.log(`[CloudinaryJob] Processing action: ${action} (Attempt ${attempts + 1})`);

  try {
    switch (action) {
      case "delete":
        if (!publicId) throw new Error("publicId is required for delete action");
        // 🧪 TEMPORARY TEST TRIGGER
        if (publicId === "FAIL_TEST") {
          throw new Error("Simulated cloudinary failure for retry testing");
        }
        await deleteFromCloudinary(publicId, resourceType || "image");
        console.log(`[CloudinaryJob] Successfully deleted: ${publicId} `);
        break;

      case "upload_inventory_media":
        if (!inventoryId || !files) throw new Error("inventoryId and files are required");
        
        await Inventory.findByIdAndUpdate(inventoryId, { uploadStatus: "PROCESSING" });
        
        const imageUrls: string[] = [];
        let videoUrl: string | undefined;

        let hasFailure = false;

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

            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }

          } catch (uploadErr) {
            console.error(`[CloudinaryJob] Failed to upload file ${file.path}:`, uploadErr);
            hasFailure = true;
          }
        }

        if (hasFailure) {
          throw new Error("One or more file uploads failed"); // ✅ THIS triggers retry
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