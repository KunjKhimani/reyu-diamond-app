import type { Request, Response } from "express";
import sendToken from "../services/token.service.js";
import {
  registerUser,
  verifyUserOtp,
  loginUser,
  getUserById, 
  upadteUserById
} from "../services/auth.service.js";
import sendResponse from "../utils/api.response.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fcmToken } = req.body;

    const user = await registerUser({ username, email, password });
    const token = sendToken(user._id.toString());
 
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      data: token,
      message:
        "User registered successfully. Please verify your email using the OTP sent to your email address.",
    });
  } catch (err: any) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Failed to register user",
      errors: err.message || "Something went wrong",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await verifyUserOtp({ email, otp });

    const token = sendToken(user._id.toString());

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Email verified successfully.",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    if (err.message === "User not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    if (err.message === "Invalid or expired OTP") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "OTP verification failed",
      errors: (err as any).message ?? "Something went wrong",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, fcmToken } = req.body;
    const user = await loginUser({ email, password });

    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    const token = sendToken(user._id.toString());

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Login Successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.log(err);
    
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Login Failed",
      errors: "Invalid email or password",
    });
  }
};

export const logout = (_req: Request, res: Response) => {
  try {
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Logout Failed",
      errors: "Something went wrong",
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Not authorized",
      });
    }
    
    const user = await getUserById(userId);

    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err: any) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to fetch user profile",
      errors: err?.message ?? "Something went wrong",
    });
  }
};

export const upadteUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Not authorized",
      });
    }

    const { username, fcmToken } = req.body;

    const user = await upadteUserById(userId, { username, fcmToken });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (err: any) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to update user profile",
      errors: err?.message ?? "Something went wrong",
    });
  }
}