import type { Response } from "express";

interface ApiResponseOptions<T = any> {
  res: Response;
  statusCode: number;
  success: boolean;
  message: string;
  data?: T | null;
  errors?: any | null;
}

const sendResponse = <T>({
  res,
  statusCode,
  success,
  message,
  data,
  errors,
}: ApiResponseOptions<T>) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    errors,
  });
};

export default sendResponse;
