import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import isValidEmail from "../utils/email.validator.js";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "admin" | "user";
  otp?: string | undefined;
  otpExpiresAt?: Date | undefined;
  isVerified: boolean;
  otpAttempts: number;
  lastOtpSent: Date;
  fcmToken?: string | null;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      maxlength: [50, "Username cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      validate: {
        validator: isValidEmail,
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    otp: {
      type: Number,
      select: false,
    },
    otpExpiresAt : {
      type : Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpAttempts : {
      type : Number,
      default : 0,
    },
    lastOtpSent : {
      type : Date,
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
