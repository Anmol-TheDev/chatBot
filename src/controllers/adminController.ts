import type { Request, Response, NextFunction, RequestHandler } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";
import { authConfig } from "../config/env.js";

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const adminLogin: RequestHandler = catchAsync(
  async (req: LoginRequest, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    // Verify credentials
    if (email !== authConfig.ADMIN_EMAIL || password !== authConfig.ADMIN_PASSWORD) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate JWT token
    const token = generateToken({
      email: authConfig.ADMIN_EMAIL,
      role: "admin",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
    });
  },
);
