import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

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

    // Check admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      return next(new AppError("Server configuration error", 500));
    }

    // Verify credentials
    if (email !== adminEmail || password !== adminPassword) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: adminEmail,
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      },
    );

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
    });
  },
);
