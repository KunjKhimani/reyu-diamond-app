import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import sendResponse from "../utils/api.response.js";

export interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      message: "Not authorized. Please provide a valid Bearer token in the Authorization header.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      message: "Not authorized. Token is missing.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    req.user = decoded;
    next();
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;
