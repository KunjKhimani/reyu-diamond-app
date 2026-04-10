import fs from "fs";
import xlsx from "xlsx";
const { readFile, utils } = xlsx;
// import { readFile, utils } from "xlsx";
import Inventory from "../models/Inventory.model.js";
import { generateUniqueBarcode } from "../utils/barcode.util.js";
import { createInventoryService } from "../services/inventory.service.js";

export interface BulkInventoryJobData {
  bulkId: string;
  sellerId: string;
  filePath: string;
}

export const processBulkInventoryJob = async (data: BulkInventoryJobData, attempt: number = 1): Promise<any> => {
  const { bulkId, sellerId, filePath } = data;
  console.log(`[BulkInventoryJob] Processing bulkId: ${bulkId} (Attempt: ${attempt})`);

  // TEST LOGIC: Force failure on first two attempts to test retries
  if (attempt < 2) {
    console.log(`[BulkInventoryJob] Simulated failure for testing retry (Current attempt: ${attempt})`);
    throw new Error(`Simulated failure for testing retries. Target success attempt is 7.`);
  }

  const headerRecord = await Inventory.findOne({ bulkId, isBulkHeader: true });
  if (!headerRecord) {
    throw new Error(`Bulk header record not found for id: ${bulkId}`);
  }

  try {
    // 1. Read the file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const workbook = readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName!];
    const rows: any[] = utils.sheet_to_json(worksheet!);

    console.log(`[BulkInventoryJob] Found ${rows.length} rows to process`);

    await Inventory.updateOne(
      { _id: headerRecord._id },
      { $set: { "bulkMetadata.totalItems": rows.length, uploadStatus: "PROCESSING" } }
    );

    let successCount = 0;
    let failureCount = 0;
    const errors: { row: number; error: string }[] = [];

    // 2. Process rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        try {
            const barcode = await generateUniqueBarcode();
            
            // Map fields
            const inventoryData = {
                title: row.title || row.Title || "Bulk Upload Item",
                description: row.description || row.Description || "",
                carat: parseFloat(row.carat || row.Carat || "0"),
                cut: (row.cut || row.Cut || "").toUpperCase(),
                color: (row.color || row.Color || "").toUpperCase(),
                clarity: (row.clarity || row.Clarity || "").toUpperCase(),
                shape: (row.shape || row.Shape || "").toUpperCase(),
                lab: row.lab || row.Lab || "GIA",
                location: row.location || row.Location || "Unknown",
                price: parseFloat(row.price || row.Price || "0"),
                currency: row.currency || row.Currency || "USD",
            };

            await createInventoryService(
               sellerId,
               barcode,
               inventoryData as any,
               [],
               undefined,
               "COMPLETED"
            );

            successCount++;
        } catch (error: any) {
            failureCount++;
            errors.push({ row: rowNum, error: error.message || "Unknown error" });
            console.error(`[BulkInventoryJob] Row ${rowNum} failed:`, error.message);
        }

        // Periodic update
        if (rowNum % 10 === 0 || rowNum === rows.length) {
            await Inventory.updateOne(
                { _id: headerRecord._id },
                { 
                  $set: { 
                      "bulkMetadata.processedCount": rowNum,
                      "bulkMetadata.successCount": successCount,
                      "bulkMetadata.failureCount": failureCount,
                      "bulkMetadata.errors": errors
                  } 
                }
            );
        }
    }

    // 3. Complete
    await Inventory.updateOne(
        { _id: headerRecord._id },
        { $set: { uploadStatus: "COMPLETED" } }
    );

    // 4. Cleanup
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    console.log(`[BulkInventoryJob] Finished processing bulkId: ${bulkId}`);

    return {
        bulkId,
        total: rows.length,
        success: successCount,
        failed: failureCount,
        errors: errors.slice(0, 20) // Return first 10 errors for dashboard summary
    };

  } catch (error: any) {
    console.error(`[BulkInventoryJob] Fatal error for bulkId ${bulkId}:`, error);
    await Inventory.updateOne(
      { _id: headerRecord._id },
      { $set: { uploadStatus: "FAILED" } }
    );
    throw error;
  }
};
