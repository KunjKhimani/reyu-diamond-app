import User from "../models/User.model.js";
import type { IUser } from "../models/User.model.js";
import { generateOTP } from "../utils/otp.utils.js";
import sendEmail from "../services/email.service.js";
import { otpTemplate } from "../utils/email.template.js";
import e from "express";

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface OtpInput {
  email: string;
  otp: string;
}

export const registerUser = async (
  input: RegisterUserInput
): Promise<IUser> => {
  const { username, email, password } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  const otp = generateOTP();

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpSent = new Date(Date.now());

  await user.save();

  await sendEmail({
      to : user.email,
      subject : "Verfiy your email",
      html : otpTemplate(Number(otp)),
  });

  return user;
};

export const verifyUserOtp = async (
  input: OtpInput
): Promise<IUser> => {
  const { email, otp } = input;

  const user = await User.findOne({ email }).select("+otp +otpExpiresAt");

  if (!user) {
    throw new Error("User not found");
  }

  if (
    !user.otp ||
    !user.otpExpiresAt ||
    user.otp !== otp ||
    user.otpExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return user;
};

export const loginUser = async (
  input: LoginUserInput
): Promise<IUser> => {
  const { email, password } = input;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

export const getUserById = async (
  userId: string
): Promise<IUser | null> => {
  const user = await User.findById(userId).select("-password -otp -otpAttempts -fcmToken -__v -createdAt -updatedAt -lastOtpSent");
  return user;
};

export const upadteUserById = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select("-password -otp -otpAttempts -fcmToken -__v -createdAt -updatedAt -lastOtpSent");
  return user;
};