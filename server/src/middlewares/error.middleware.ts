import type { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import sendResponse from "../utils/api.response.js";

interface CustomError extends Error {
  statusCode?: number;
  value?: string;
  kind?: string;
}

const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err.stack);

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Invalid ID format. Please provide a valid ID.",
      errors: `Invalid ID format: ${err.value}`,
    });
  }

  // Handle Mongoose ValidationError
  if (err instanceof MongooseError.ValidationError) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Validation Error",
      errors: err.message,
    });
  }

  // Handle other errors
  return sendResponse({
    res,
    statusCode: err.statusCode || 500,
    success: false,
    message: "Something went wrong. Please try again.",
    errors: err.message || "Unknown error",
  });
};

export default errorHandler;
