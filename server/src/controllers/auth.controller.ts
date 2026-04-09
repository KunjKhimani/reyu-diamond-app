import type { Request, Response, NextFunction } from "express";
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
import { logService } from "../services/log.service.js";
import { sendDelayedEmail } from "../utils/delayedMailer.js";


export const register = async (req: Request, res: Response, next: NextFunction) => {
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
    await logService.createSystemLog({
      eventType: "AUTH_FAILURE",
      severity: "WARNING",
      message: `User registration failed for email: ${req.body.email}. Reason: ${err.message}`,
      meta: {
        email: req.body.email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        error: err.message
      }
    });
    err.statusCode = 400;
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    const user = await verifyUserOtp({ email, otp });

    const token = sendToken(user._id.toString());
    
    // Send delayed welcome email after 5 minutes
    await sendDelayedEmail({
      to: user.email,
      subject: "Welcome to the Reyu Diamond Trading Platform!",
      html: `<h1>Welcome, ${user.username}!</h1><p>We're thrilled to have you join our platform. This is a quick check-in 5 minutes after your verification.</p>`
    }, 5);

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
      err.statusCode = 404;
    } else if (err.message === "Invalid or expired OTP") {
      err.statusCode = 400;
    }
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fcmToken } = req.body;
    const user = await loginUser({ email, password });

    if (user.accountStatus === "DEACTIVE") {
      return next(Object.assign(new Error("Account Deactivated"), { statusCode: 403, errors: "Your account has been deactivated. Please contact support." }));
    }

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

    // Log the system event
    await logService.createSystemLog({
      eventType: "AUTH_FAILURE",
      severity: "WARNING",
      message: `Login failed for email: ${req.body.email}. Reason: ${err.message}`,
      meta: {
        email: req.body.email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        error: err.message
      }
    });

    if (err.message === "Please verify your email first" || err.message === "Invalid credentials") {
      err.statusCode = 400;
    }
    next(err);
  }
};

export const logout = (_req: Request, res: Response, next: NextFunction) => {
  try {
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id as string;
    if (!userId) {
      return next(Object.assign(new Error("Not authorized"), { statusCode: 401 }));
    }

    const user = await getUserById(userId);

    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err: any) {
    next(err);
  }
};

export const upadteUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      const err: any = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
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
    next(err);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      const err: any = new Error("Email is required");
      err.statusCode = 400;
      throw err;
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
      err.statusCode = 404;
    } else if (err.message === "User is already verified") {
      err.statusCode = 400;
    }
    next(err);
  }
};

export const forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      const err: any = new Error("Email is required");
      err.statusCode = 400;
      throw err;
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
      err.statusCode = 404;
    }
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      const err: any = new Error("Reset token is required");
      err.statusCode = 400;
      throw err;
    }

    await resetPasswordService(token, newPassword);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err: any) {
    if (err.message === "Invalid or expired reset link" || err.message === "Password must be at least 6 characters") {
      err.statusCode = 400;
    } else if (err.message === "User not found") {
      err.statusCode = 404;
    }
    next(err);
  }
}; 