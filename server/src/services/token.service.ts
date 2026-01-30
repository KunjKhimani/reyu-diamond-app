import jwt from "jsonwebtoken";

const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

export const generateResetPasswordToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, purpose: "password_reset" },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
};

export default generateToken;
