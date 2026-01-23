import crypto from "crypto";
import Inventory from "../models/Inventory.model.js";

export const generateUniqueBarcode = async (): Promise<string> => {
  let barcode: string = "";
  let exists = true;

  while (exists) {
    barcode = "DIA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    exists = !!(await Inventory.findOne({ barcode }));
  }

  return barcode;
};
