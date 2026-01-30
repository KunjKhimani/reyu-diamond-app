import { v2 as cloudinary } from "cloudinary";
import { Cloudinary } from "../config/cloudinary.config.js";

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  Cloudinary();
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url)
          return reject(new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
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
