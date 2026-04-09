import { v2 as cloudinary } from "cloudinary";
import { Cloudinary } from "../config/cloudinary.config.js";
import fs from "fs";

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "image"
): Promise<string> {
  const { secure_url } = await uploadToCloudinaryDetails(
    file,
    folder,
    resourceType
  );
  return secure_url;
}

export async function uploadToCloudinaryDetails(
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "image"
): Promise<{ secure_url: string; public_id: string }> {
  Cloudinary();

  console.log(
    `[Cloudinary] Uploading file to folder: ${folder}, resourceType: ${resourceType}`
  );

  return new Promise((resolve, reject) => {
    // 1. Handle Memory Storage (Buffer)
    if (file.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id)
            return reject(new Error("Cloudinary upload failed"));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(file.buffer);
    } 
    // 2. Handle Disk Storage (Path)
    else if (file.path) {
      cloudinary.uploader.upload(
        file.path,
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          // Cleanup disk file regardless of success/error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          if (error) return reject(error);
          if (!result?.secure_url || !result?.public_id)
            return reject(new Error("Cloudinary upload failed"));
          
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
    } else {
      reject(new Error("File content is missing (no buffer or path found)"));
    }
  });
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  Cloudinary();
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "raw",
        format: "pdf", // 🔑 VERY IMPORTANT
        flags: "attachment", // 🔑 forces download
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url)
          return reject(new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "auto" | "raw" = "image"
): Promise<void> {
  Cloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve();
      }
    );
  });
}
export async function uploadDiskFileToCloudinary(
  filePath: string,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "image"
): Promise<{ secure_url: string; public_id: string }> {
  Cloudinary();
  console.log(`[Cloudinary] Uploading disk file ${filePath} to folder: ${folder}`);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url || !result?.public_id)
          return reject(new Error("Cloudinary upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
  });
}
