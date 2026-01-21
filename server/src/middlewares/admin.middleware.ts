import type { Response, NextFunction } from "express";
import User from "../models/User.model.js";
import type { AuthRequest } from "./auth.middleware.js";

const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authorized" });

    const user = await User.findById(userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    return next();
  } catch (_e) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export default isAdmin;

