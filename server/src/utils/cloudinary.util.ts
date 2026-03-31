/**
 * Extracts the public ID from a Cloudinary URL.
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg -> sample
 * Example: https://res.cloudinary.com/demo/image/upload/folder/subfolder/image1.png -> folder/subfolder/image1
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Split by '/upload/' to get the part after it
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // Remove the version (e.g., 'v1234567890/') and the file extension
    const pathAfterUpload = parts[1];
    if (!pathAfterUpload) return null;

    const pathParts = pathAfterUpload.split("/");
    if (pathParts.length === 0) return null;
    
    // If the first part starts with 'v' followed by digits, it's a version number
    const startIdx = /^v\d+/.test(pathParts[0]!) ? 1 : 0;
    
    // Join the remaining parts back and remove the extension
    const fullPath = pathParts.slice(startIdx).join("/");
    if (!fullPath) return null;

    return fullPath.split(".")[0] || null;

  } catch (error) {
    console.error("Error extracting public ID from Cloudinary URL:", error);
    return null;
  }
};
