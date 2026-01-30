import type { Request, Response } from "express";
import sendToken from "../services/token.service.js";
import {
  registerUser,
  verifyUserOtp,
  loginUser,
  getUserById,
  upadteUserById,
  resendOtpService,
  forgetPasswordService,
  resetPasswordService,
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
  } catch (err: any) {
    console.log(err);
    
    if (err.message === "Please verify your email first") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Please verify your email first",
        errors: "Please verify your email before logging in. Check your email for the OTP or request a new one.",
      });
    }

    if (err.message === "Invalid credentials") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Login Failed",
        errors: "Invalid email or password",
      });
    }
    
    return sendResponse({
      res,
      statusCode: 400,
      success: false,
      message: "Login Failed",
      errors: err?.message ?? "Invalid email or password",
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
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Email is required",
      });
    }

    await resendOtpService(email);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "OTP has been resent to your email address",
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

    if (err.message === "User is already verified") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "User is already verified",
      });
    }

    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to resend OTP",
      errors: err?.message ?? "Something went wrong",
    });
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Email is required",
      });
    }

    await forgetPasswordService(email);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Password reset link has been sent on the ${email}.`,
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
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to send reset link",
      errors: err?.message ?? "Something went wrong",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Reset token is required",
      });
    }

    await resetPasswordService(token, newPassword);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err: any) {
    if (err.message === "Invalid or expired reset link") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Invalid or expired reset link. Please request a new password reset.",
      });
    }
    if (err.message === "Password must be at least 6 characters") {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: err.message,
      });
    }
    if (err.message === "User not found") {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to reset password",
      errors: err?.message ?? "Something went wrong",
    });
  }
}; 